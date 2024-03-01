// processImage.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function processImage(ogImage,imageName) {
  const imagePath = path.join("/tmp", imageName);
  
  // Download the image (assuming fetch is defined globally or imported)
  const response = await fetch(ogImage);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Use sharp to resize and convert the image to JPEG format
  await sharp(buffer)
    .resize({ width: 800 }) // Example: resize to width of 800 pixels
    .jpeg({ quality: 70 }) // Example: reduce quality to 70%
    .toFile(imagePath);

  return imagePath;
}

module.exports = processImage;
