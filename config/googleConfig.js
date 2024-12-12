global.self = global; // Polyfill untuk self

const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');
require('dotenv').config();

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME; // Use the bucket name from .env

// Inisialisasi Firestore
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// Function to download file from GCS
const downloadFileFromGCS = async (fileName) => {
  try {
    console.log(`Downloading file from GCS: ${fileName}`);
    const file = storage.bucket(bucketName).file(fileName);
    const fileContents = await file.download();
    console.log(`Downloaded file: ${fileName}`);
    return fileContents[0]; // Return the content as a Buffer
  } catch (error) {
    console.error(`Error downloading file from GCS: ${fileName}`, error);
    throw new Error('Failed to download file from GCS');
  }
};

module.exports = { downloadFileFromGCS, db };
