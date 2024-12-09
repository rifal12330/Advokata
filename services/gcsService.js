// services/gcsService.js
const { bucket } = require('../config/gcsConfig');

async function getModelBuffer(gcsFilePath) {
  try {
    const file = bucket.file(gcsFilePath);
    const [buffer] = await file.download();
    console.log(`Loaded model from GCS: ${gcsFilePath}`);
    return buffer;
  } catch (error) {
    console.error(`Error reading model from GCS: ${error}`);
    throw error;
  }
}

module.exports = { getModelBuffer };
