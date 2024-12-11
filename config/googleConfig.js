const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME; // Use the bucket name from .env
require('dotenv').config();


// Function to download file from GCS
const downloadFileFromGCS = async (fileName) => {
  const file = storage.bucket(bucketName).file(fileName);
  const fileContents = await file.download();
  return fileContents[0]; // Return the content as a Buffer
};

module.exports = { downloadFileFromGCS };
