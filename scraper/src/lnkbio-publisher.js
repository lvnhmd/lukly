const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Set headless: true for no UI
  const page = await browser.newPage();

  await page.goto("https://lnk.bio/login/credentials", {
    waitUntil: "networkidle0"
  });

  // Click the email input field before typing
  await page.waitForSelector("#email", { visible: true });
  await page.click("#email");
  await page.type("#email", "ali.elvin@gmail.com");

  // Click the password input field before typing
  await page.waitForSelector("#password", { visible: true });
  await page.click("#password");
  await page.type("#password", "yZ^@L2DQ7o*$");

  await page.waitForSelector("#submit", { visible: true });
  await page.click("#submit");
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  await page.waitForSelector(
    'div.btn-layout-properties-big[data-title="Add Lnk"]',
    { visible: true }
  );
  await page.click('div.btn-layout-properties-big[data-title="Add Lnk"]');

  // Typing into the title input field
await page.waitForSelector('#nl_title', { visible: true });
await page.type('#nl_title', 'Your Desired Title');

// Typing into the link input field
await page.waitForSelector('#nl_link', { visible: true });
await page.type('#nl_link', 'https://www.example.com/');

await new Promise(resolve => setTimeout(resolve, 1000));

// Clicking the "Image" div to open the first popup
await page.waitForSelector('div.col-8.ts-bigger.pl-0.types.type-lnk', { visible: true });
await page.click('div.col-8.ts-bigger.pl-0.types.type-lnk');

// Clicking the "Select image" label in the second popup
await page.waitForSelector('label#NL_EditImageChoose', { visible: true });


// Wait for the file chooser to open and set the file path
const [fileChooser] = await Promise.all([
  page.waitForFileChooser(),
  page.click('label#NL_EditImageChoose'), // This might be redundant if the click is already performed above
]);

// Assuming "path/to/your/image.png" is the path to the image you want to upload
await fileChooser.accept(['/Users/elvin/Desktop/workspace/lukly/web-scraper/scraper/images/screen-shot-2024-01-08-at-13-01-05-1920x1080.png']);

await new Promise(resolve => setTimeout(resolve, 3000));

await page.evaluate(() => {
  document.querySelector('button.btn-save-image').click();
});

await new Promise(resolve => setTimeout(resolve, 1000));

await page.click('#nl_addlnk');


})();
