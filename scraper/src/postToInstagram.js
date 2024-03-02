const axios = require('axios');
require('dotenv').config();

async function postToInstagram(imageUrl, caption) {
    // Step 1: Create a media object container
    const createMediaResponse = await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.IG_ACCOUNT_ID}/media`,
      {
        image_url: imageUrl,
        caption: caption,
        access_token: process.env.FB_ACCESSTOKEN
      }
    );
  
    const creationId = createMediaResponse.data.id;
  
    // Step 2: Publish the media object
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v17.0/${process.env.IG_ACCOUNT_ID}/media_publish`,
      {
        creation_id: creationId,
        access_token: process.env.FB_ACCESSTOKEN
      }
    );
  
    return publishResponse.data;
  }

module.exports = postToInstagram;
