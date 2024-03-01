const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const uploadImageToS3 = require('./uploadToAWS');
const processImage = require('./processImage');
require('dotenv').config();

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

(async () => {
  await client.connect();
  const database = client.db(dbName);
  const collection = database.collection(collectionName);
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://www.stylist.co.uk/win", {
    waitUntil: "networkidle2",
    timeout: 0
  });
  console.log("Page loaded, fetching competition links...");

  const links = await page.$$eval("a", (as) =>
    as
      .filter((a) => a.textContent.toLowerCase().includes("win") && a.href)
      .map((a) => a.href)
  );

  let results = [];
  let processedUrls = new Set(); // Track processed URLs
  let processedImages = new Set(); // Track downloaded images
  const imagesDir = path.join(__dirname, "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
  }

  for (let [index, link] of links.entries()) {
    if (processedUrls.has(link)) {
      console.log(`Skipping duplicate link: ${link}`);
      continue; // Skip duplicate URLs
    }

    try {
      console.log(`Processing link ${index + 1}/${links.length}: ${link}`);
      const response = await collection.findOne({ url: link });
      if (response) continue;

      await page.goto(link, { waitUntil: "networkidle2", timeout: 0 });
      const title = await page.title();
      if (title.split(" ").length <= 1) continue;

      const bodyText = await page.evaluate(() => document.body.innerText);
      let isClosed = /Oh no, you’re a little late!/i.test(bodyText);

      // Check for and parse closing date
      const dateRegex =
        /closes?:? on (\d{1,2}[stndrh]{0,2} \w+ \d{4})|closes?: (\d{1,2}[stndrh]{0,2} \w+ \d{4})|closes?: (\d{1,2}\/\d{1,2}\/\d{2})/i;
      const closingMatch = bodyText.match(dateRegex);
      let closingDate = "Not Found";

      if (closingMatch) {
        const dateStr = closingMatch[1] || closingMatch[2] || closingMatch[3];
        const parsedDate = Date.parse(dateStr);
        closingDate = !isNaN(parsedDate)
          ? new Date(parsedDate).toISOString()
          : "Not Found";
        isClosed = isClosed || new Date(closingDate) < new Date();
      }
      
      if (!isClosed) {
        let publicImagePath = "";
        const ogImage = await page
          .$eval('meta[property="og:image"]', (element) => element.content)
          .catch(() => "");
        
        if (ogImage && !processedImages.has(ogImage)) {
          const imageName =
            path.basename(
              new URL(ogImage).pathname,
              path.extname(new URL(ogImage).pathname)
            ) + ".jpg";
          
          const imagePath = await processImage(ogImage, imageName);

          publicImagePath = await uploadImageToS3(imagePath, imageName);

          processedImages.add(ogImage); // Mark image as processed
        }

        const newItem = {
          title,
          url: link,
          publisher: "stylist",
          image: publicImagePath,
          closing: closingDate,
          isPublishedToFB: false,
          isPublishedToIG: false
        };

        await collection.insertOne(newItem);

        results.push(newItem);
        processedUrls.add(link); // Mark URL as processed
      }
    } catch (error) {
      console.error(`Error processing link ${link}: ${error.message}`);
    }
  }

  await browser.close();
  fs.writeFileSync("results.json", JSON.stringify(results, null, 2));
  console.log("Results saved. Duplicates and expired competitions excluded.");
})();
