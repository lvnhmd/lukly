const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const download = require('image-downloader');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.stylist.co.uk/win', { waitUntil: 'networkidle2', timeout: 0 });
  console.log('Page loaded, fetching competition links...');

  const links = await page.$$eval('a', (as) => as.filter(a => a.textContent.toLowerCase().includes('win') && a.href).map(a => a.href));
  
  let results = [];
  let processedUrls = new Set(); // Track processed URLs
  let processedImages = new Set(); // Track downloaded images
  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)){
    fs.mkdirSync(imagesDir);
  }
  
  for (let [index, link] of links.entries()) {
    if (processedUrls.has(link)) {
      console.log(`Skipping duplicate link: ${link}`);
      continue; // Skip duplicate URLs
    }
    
    try {
      console.log(`Processing link ${index + 1}/${links.length}: ${link}`);
      await page.goto(link, { waitUntil: 'networkidle2', timeout: 0 });
      const title = await page.title();
      if (title.split(' ').length <= 1) continue;

      const bodyText = await page.evaluate(() => document.body.innerText);
      let isClosed = /Oh no, you’re a little late!/i.test(bodyText);

      // Check for and parse closing date
      const dateRegex = /closes?:? on (\d{1,2}[stndrh]{0,2} \w+ \d{4})|closes?: (\d{1,2}[stndrh]{0,2} \w+ \d{4})|closes?: (\d{1,2}\/\d{1,2}\/\d{2})/i;
      const closingMatch = bodyText.match(dateRegex);
      let closingDate = "Not Found";
      
      if (closingMatch) {
        const dateStr = closingMatch[1] || closingMatch[2] || closingMatch[3];
        const parsedDate = Date.parse(dateStr);
        closingDate = !isNaN(parsedDate) ? new Date(parsedDate).toISOString() : "Not Found";
        isClosed = isClosed || new Date(closingDate) < new Date();
      }

      if (!isClosed) {
        const ogImage = await page.$eval('meta[property="og:image"]', element => element.content).catch(() => "");
        let imageName = "";
        if (ogImage && !processedImages.has(ogImage)) {
          imageName = path.basename(new URL(ogImage).pathname);
          let imagePath = path.join(imagesDir, imageName);
          await download.image({ url: ogImage, dest: imagePath });
          processedImages.add(ogImage); // Mark image as downloaded
        }

        results.push({
          title,
          url: link,
          publisher: "stylist",
          image: imageName,
          closing: closingDate
        });
        processedUrls.add(link); // Mark URL as processed
      }
    } catch (error) {
      console.error(`Error processing link ${link}: ${error.message}`);
    }
  }

  await browser.close();
  fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
  console.log('Results saved. Duplicates and expired competitions excluded.');
})();
