// services/qaService.js
const tflite = require('@tensorflow/tfjs-tflite');
const { downloadFileFromGCS } = require('../config/googleConfig');

let model;

const loadModel = async () => {
  try {
    console.log('Downloading model from GCS...');
    const localModelPath = await downloadFileFromGCS('advokata-model/qa_model.tflite'); // Replace with your actual GCS path
    console.log('Model downloaded to:', localModelPath);

    console.log('Loading model...');
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
  // Here you would use the loaded model to make a prediction based on the input tensor
  // This is just an example, adapt it according to your actual model
  try {
    console.log('Generating answer for the given question tensor...');
    // Assuming model is a function that generates an answer based on the tensor
    const answer = await model.predict(questionTensor); // Adapt this line based on your actual model
    return answer;
  } catch (error) {
    console.error('Error during model prediction:', error);
    throw new Error('Model prediction failed');
  }
};

module.exports = { loadModel, getAnswer };
