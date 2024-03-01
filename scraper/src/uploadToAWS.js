// uploadToAWS.js
const AWS = require('aws-sdk');
const fs = require('fs');
require('dotenv').config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESSKEYID,
  secretAccessKey: process.env.AWS_SECRETACCESSKEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

async function uploadImageToS3(imagePath, imageName) {
  const fileContent = fs.readFileSync(imagePath);
  const params = {
    Bucket: process.env.AWS_S3BUCKET,
    Key: imageName,
    Body: fileContent,
    ContentType: "image/jpeg"
  };

  try {
    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully. ${data.Location}`);
    return data.Location;
  } catch (err) {
    console.error("Error uploading file: ", err);
    throw err;
  }
}

module.exports = uploadImageToS3;
