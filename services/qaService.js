global.self = global; // Polyfill untuk self

require('dotenv').config();
const tf = require('@tensorflow/tfjs-node');
const { downloadFileFromGCS, db } = require('../config/googleConfig');
const fs = require('fs');
const admin = require('firebase-admin');

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
    model = await tf.loadLayersModel(`file://${localModelPath}`);
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
  return tf.tensor([tokens]); // Tambahkan batch dimensi
};

// Fungsi untuk mencari konteks berdasarkan embeddings
const searchContext = (tokenizedQuestion) => {
  let bestMatch = null;
  let maxSimilarity = -Infinity;

  embeddings.forEach((embedding, idx) => {
    const similarity = tf.matMul(tokenizedQuestion, tf.tensor([embedding])).dataSync()[0];
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = idx;
    }
  });

  return embeddings[bestMatch];
};

// Fungsi untuk menyimpan pertanyaan dan jawaban ke Firestore
const saveToFirestore = async (question, answer) => {
  try {
    await db.collection('qa_logs').add({
      question,
      answer,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Saved to Firestore successfully');
  } catch (error) {
    console.error('Error saving to Firestore:', error);
  }
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
    const inputTensor = tf.concat([tokenizedQuestion, tf.tensor([context])], 1);

    // Prediksi jawaban
    const prediction = model.predict(inputTensor);
    const answerData = prediction.dataSync();
    const answerText = answerData.toString();

    // Simpan pertanyaan dan jawaban ke Firestore
    await saveToFirestore(question, answerText);

    return answerText;
  } catch (error) {
    console.error('Error during model prediction:', error);
    throw new Error('Model prediction failed');
  }
};

module.exports = { loadModel, getAnswer };
