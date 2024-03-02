const { MongoClient } = require("mongodb");
const postToFacebook = require('./postToFacebook');
const postToInstagram = require('./postToInstagram');

require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URI);
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

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
  }

  competitions = await collection
    .find({
      $or: [{ isPublishedToIG: { $exists: false } }, { isPublishedToIG: false }]
    })
    .toArray();

  for (const competition of competitions) {
    try {
      const postResult = await postToInstagram(
        competition.image,
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

module.exports = updateAndPostCompetitions;
