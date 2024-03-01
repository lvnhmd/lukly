const { MongoClient } = require("mongodb");
const axios = require('axios');
const FB = require("fb");
require('dotenv').config();

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

// You will need to fill in your own access token here
FB.setAccessToken(process.env.FB_ACCESSTOKEN);

const postToFacebook = async (competition) => {
  return new Promise((resolve, reject) => {
    FB.api(
      "me/feed",
      "post",
      { message: competition.title, link: competition.url },
      (res) => {
        if (!res || res.error) {
          console.error(!res ? "error occurred" : res.error);
          reject(res.error);
        } else {
          console.log("Post Id: " + res.id);
          resolve(res.id); // Resolve the promise with the post ID
        }
      }
    );
  });
};

async function postToInstagram(imageUrl, caption) {
  // Step 1: Create a media object container
  const createMediaResponse = await axios.post(
    `https://graph.facebook.com/v17.0/${process.env.IG_ACCOUNT_ID}/media`,
    {
      image_url: imageUrl,
      caption: caption,
      access_token: accessToken
    }
  );

  const creationId = createMediaResponse.data.id;

  // Step 2: Publish the media object
  const publishResponse = await axios.post(
    `https://graph.facebook.com/v17.0/${process.env.IG_ACCOUNT_ID}/media_publish`,
    {
      creation_id: creationId,
      access_token: accessToken
    }
  );

  return publishResponse.data;
}

async function updateAndPostCompetitions() {
  await client.connect();
  const collection = client.db(dbName).collection(collectionName);

  let competitions = await collection
    .find({
      $or: [{ isPublishedToFB: { $exists: false } }, { isPublishedToFB: false }]
    })
    .toArray();

  for (const competition of competitions) {
    try {
      const postId = await postToFacebook(competition);
      if (postId) {
        await collection.updateOne(
          { _id: competition._id },
          { $set: { isPublishedToFB: true } }
        );
        console.log(
          `Competition ${competition._id} is published to FB and marked as published in DB.`
        );
      }
    } catch (error) {
      console.error(
        `Failed to post competition ${competition._id}: ${error} to Facebook`
      );
    }

    try {
      const postResult = await postToInstagram(
        `images/${competition.image}`,
        competition.title + " link in bio ↑"
      );
      if (postResult) {
        await collection.updateOne(
          { _id: competition._id },
          { $set: { isPublishedToIG: true } }
        );
        console.log(`Competition ${competition._id} published to Instagram.`);
      }
    } catch (error) {
      console.error(
        `Failed to post competition ${competition._id} to Instagram:`,
        error
      );
    }
  }

  competitions = await collection
    .find({
      $or: [{ isPublishedToIG: { $exists: false } }, { isPublishedToIG: false }]
    })
    .toArray();

  for (const competition of competitions) {
    try {
      const postResult = await postToInstagram(
        'https://lukly.s3.eu-west-2.amazonaws.com/untitled-design-2024-02-26t140415-963-1120x630.jpg',
        competition.title + " > link in bio ↑"
      );
      if (postResult) {
        await collection.updateOne(
          { _id: competition._id },
          { $set: { isPublishedToIG: true } }
        );
        console.log(`Competition ${competition._id} published to Instagram.`);
      }
    } catch (error) {
      console.error(
        `Failed to post competition ${competition._id} to Instagram:`,
        error
      );
    }
  }

  await client.close();
}

updateAndPostCompetitions().catch(console.error);
