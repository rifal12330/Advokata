// services/qaService.js

require('dotenv').config();  // Load environment variables from .env file

global.self = { location: { origin: '' } }; // Polyfill for self
const tf = require('@tensorflow/tfjs-node');
const { downloadFileFromGCS } = require('../config/googleConfig');
const tflite = require('@tensorflow/tfjs-tflite');

// Load environment variables from .env
const modelFilePath = process.env.MODEL_FILE_PATH; // Path for your model in GCS

let model;

// Load model from Google Cloud Storage (GCS)
const loadModel = async () => {
  try {
    console.log('Downloading model from GCS...');
    // Use the model path defined in the .env file
    const localModelPath = await downloadFileFromGCS(modelFilePath);
    console.log('Model downloaded to:', localModelPath);  // Log the local model path correctly

    console.log('Loading model...');
    // Load the TFLite model from the downloaded local path
    model = await tflite.loadTFLiteModel(`file://${localModelPath}`);
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Error loading the model from GCS:', error);
    throw new Error('Model loading failed');
  }
};

// Function to get the answer based on the input questionTensor
const getAnswer = async (questionTensor) => {
  if (!model) {
    throw new Error('Model is not loaded yet');
  }

  try {
    console.log('Generating answer for the given question tensor...');
    // Use the loaded model to make a prediction based on the tensor
    const answer = await model.predict(questionTensor); // Adapt this line based on your actual model's prediction function
    return answer;
  } catch (error) {
    console.error('Error during model prediction:', error);
    throw new Error('Model prediction failed');
  }
};

module.exports = { loadModel, getAnswer };
