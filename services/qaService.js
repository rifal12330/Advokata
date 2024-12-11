const tf = require('@tensorflow/tfjs-node');
const { downloadFileFromGCS } = require('../config/googleConfig');
require('dotenv').config();


// Function to load the TensorFlow Lite model from GCS
const loadModel = async () => {
  try {
    const modelBuffer = await downloadFileFromGCS(process.env.MODEL_FILE_PATH);
    const model = await tf.node.loadTFLiteModel(modelBuffer);
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    throw new Error('Failed to load model');
  }
};

// Function to load tokenizer and embeddings from GCS
const loadTokenizerAndEmbeddings = async () => {
  try {
    const tokenizerBuffer = await downloadFileFromGCS(process.env.TOKENIZER_FILE_PATH);
    const embeddingsBuffer = await downloadFileFromGCS(process.env.EMBEDDINGS_FILE_PATH);
    
    const tokenizer = JSON.parse(tokenizerBuffer.toString());
    const embeddings = JSON.parse(embeddingsBuffer.toString());

    return { tokenizer, embeddings };
  } catch (error) {
    console.error('Error loading tokenizer and embeddings:', error);
    throw new Error('Failed to load tokenizer and embeddings');
  }
};

// Function to get an answer based on the input tensor
const getAnswer = async (inputTensor) => {
  const model = await loadModel();
  const { tokenizer, embeddings } = await loadTokenizerAndEmbeddings();

  // Tokenize and match with embeddings
  const tokenizedInput = tokenizer.encode(inputTensor); // Tokenize input
  const inputEmbedding = embeddings[tokenizedInput]; // Match with embeddings

  // Predict using the TFLite model
  const prediction = await model.predict(inputEmbedding);
  return prediction;
};

module.exports = { getAnswer, loadModel };
