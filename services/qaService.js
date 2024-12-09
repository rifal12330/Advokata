// services/qaService.js
const tf = require('@tensorflow/tfjs-node');
const { getModelBuffer } = require('./gcsService');
require('dotenv').config();

let model = null; // Cache model agar tidak perlu di-load berulang kali

async function loadModel() {
  if (model) return model;

  try {
    const modelBuffer = await getModelBuffer(process.env.MODEL_FILE_PATH);
    model = await tf.loadGraphModel(tf.io.fromMemory(modelBuffer));
    console.log('Model loaded successfully from memory');
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    throw error;
  }
}

// Fungsi untuk mendapatkan jawaban
async function getAnswer(inputTensor) {
  const model = await loadModel();
  const prediction = model.predict(inputTensor);
  return prediction.arraySync()[0];
}

module.exports = { getAnswer };
