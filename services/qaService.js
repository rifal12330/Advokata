// services/qaService.js

require('dotenv').config();
const tf = require('@tensorflow/tfjs-node');
const { downloadFileFromGCS } = require('../config/googleConfig');
const tflite = require('@tensorflow/tfjs-tflite');
const fs = require('fs');

// Variabel untuk menyimpan path model dan file lainnya
const modelFilePath = process.env.MODEL_FILE_PATH;
const tokenizerFilePath = process.env.TOKENIZER_FILE_PATH;
const embeddingsFilePath = process.env.EMBEDDINGS_FILE_PATH;

let model;
let tokenizer;
let embeddings;

// Fungsi untuk memuat tokenizer
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

// Fungsi untuk memuat embeddings
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

// Fungsi untuk memuat model dari Google Cloud Storage
const loadModel = async () => {
  try {
    console.log('Downloading model from GCS...');
    const localModelPath = await downloadFileFromGCS(modelFilePath);
    console.log('Model downloaded to:', localModelPath);

    console.log('Loading model...');
    model = await tflite.loadTFLiteModel(`file://${localModelPath}`);
    console.log('Model loaded successfully');

    // Muat tokenizer dan embeddings
    await loadTokenizer();
    await loadEmbeddings();
  } catch (error) {
    console.error('Error loading the model from GCS:', error);
    throw new Error('Model loading failed');
  }
};

// Fungsi untuk men-tokenize pertanyaan
const tokenizeQuestion = (question) => {
  const tokens = question.split(' ').map((word) => tokenizer[word] || 0);
  return tf.tensor(tokens);
};

// Fungsi untuk mencari konteks berdasarkan embeddings
const searchContext = (tokenizedQuestion) => {
  let bestMatch = null;
  let maxSimilarity = -Infinity;

  embeddings.forEach((embedding, idx) => {
    const similarity = tf.matMul(tokenizedQuestion, tf.tensor(embedding)).dataSync()[0];
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = idx;
    }
  });

  return embeddings[bestMatch];
};

// Fungsi untuk mendapatkan jawaban berdasarkan pertanyaan
const getAnswer = async (question) => {
  if (!model) {
    throw new Error('Model is not loaded yet');
  }

  try {
    const tokenizedQuestion = tokenizeQuestion(question);
    const context = searchContext(tokenizedQuestion);

    // Gabungkan token pertanyaan dengan konteks untuk prediksi
    const inputTensor = tf.concat([tokenizedQuestion, tf.tensor(context)], 0);

    // Prediksi jawaban
    const answer = await model.predict(inputTensor);
    return answer.dataSync();
  } catch (error) {
    console.error('Error during model prediction:', error);
    throw new Error('Model prediction failed');
  }
};

module.exports = { loadModel, getAnswer };
