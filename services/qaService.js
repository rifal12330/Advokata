// services/qaService.js

require('dotenv').config();  // Load environment variables from .env file

global.self = { location: { origin: '' } }; // Polyfill for self
const tf = require('@tensorflow/tfjs-node');
const { downloadFileFromGCS } = require('../config/googleConfig');
const tflite = require('@tensorflow/tfjs-tflite');
const fs = require('fs');

// Load environment variables
const modelFilePath = process.env.MODEL_FILE_PATH; // Path for your model in GCS
const tokenizerFilePath = process.env.TOKENIZER_FILE_PATH; // Path for your tokenizer in GCS
const embeddingsFilePath = process.env.EMBEDDINGS_FILE_PATH; // Path for your embeddings in GCS

let model;
let tokenizer;
let embeddings;

// Load the tokenizer from file (assuming it’s a JSON file)
const loadTokenizer = async () => {
  try {
    const tokenizerData = fs.readFileSync(tokenizerFilePath, 'utf8');
    tokenizer = JSON.parse(tokenizerData);
    console.log('Tokenizer loaded successfully');
  } catch (error) {
    console.error('Error loading tokenizer:', error);
    throw new Error('Tokenizer loading failed');
  }
};

// Load the embeddings from file (assuming it's a JSON file)
const loadEmbeddings = async () => {
  try {
    const embeddingsData = fs.readFileSync(embeddingsFilePath, 'utf8');
    embeddings = JSON.parse(embeddingsData);
    console.log('Embeddings loaded successfully');
  } catch (error) {
    console.error('Error loading embeddings:', error);
    throw new Error('Embeddings loading failed');
  }
};

// Load model, tokenizer, and embeddings from GCS when the server starts
const loadModel = async () => {
  try {
    console.log('Downloading model from GCS...');
    const localModelPath = await downloadFileFromGCS(modelFilePath);
    console.log('Model downloaded to:', localModelPath);

    console.log('Loading model...');
    model = await tflite.loadTFLiteModel(`file://${localModelPath}`);
    console.log('Model loaded successfully');

    // Load tokenizer and embeddings
    await loadTokenizer();
    await loadEmbeddings();
  } catch (error) {
    console.error('Error loading the model from GCS:', error);
    throw new Error('Model loading failed');
  }
};

// Function for tokenizing a question
const tokenizeQuestion = (question) => {
  const tokens = question.split(' ').map((word) => tokenizer[word] || 0); // Simple tokenization
  return tf.tensor(tokens);
};

// Function for searching context based on embeddings
const searchContext = (tokenizedQuestion) => {
  // Compute similarity (simplified for demonstration; adjust as needed)
  let bestMatch = null;
  let maxSimilarity = -Infinity;

  embeddings.forEach((embedding, idx) => {
    const similarity = tf.matMul(tokenizedQuestion, tf.tensor(embedding)).dataSync()[0]; // Dot product for similarity
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = idx;
    }
  });

  return embeddings[bestMatch]; // Return the best matching context
};

// Function to get the answer based on the input questionTensor
const getAnswer = async (question) => {
  if (!model) {
    throw new Error('Model is not loaded yet');
  }

  try {
    // Tokenize the question
    const tokenizedQuestion = tokenizeQuestion(question);
    console.log('Tokenized question:', tokenizedQuestion);

    // Search for relevant context
    const context = searchContext(tokenizedQuestion);
    console.log('Found context:', context);

    // Combine tokenized question and context for prediction
    const inputTensor = tf.concat([tokenizedQuestion, tf.tensor(context)], 0);

    // Use the loaded model to make a prediction based on the tensor
    const answer = await model.predict(inputTensor); // Adjust based on model prediction
    return answer.dataSync(); // Return the predicted answer

  } catch (error) {
    console.error('Error during model prediction:', error);
    throw new Error('Model prediction failed');
  }
};

module.exports = { loadModel, getAnswer };
