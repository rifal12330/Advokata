global.self = global; // Polyfill untuk self

require('dotenv').config();
const tf = require('@tensorflow/tfjs-node');
const { downloadModelFilesFromGCS, downloadTokenizerFileFromGCS, downloadEmbeddingsFileFromGCS, db } = require('../config/googleConfig');
const fs = require('fs').promises;
const admin = require('firebase-admin');
const cosineSimilarity = require('cosine-similarity');

let model;
let tokenizer;
let embeddings;

/**
 * Fungsi untuk memuat tokenizer dari file yang diunduh dari GCS.
 */
const loadTokenizer = async () => {
  try {
    const localTokenizerPath = await downloadTokenizerFileFromGCS('advokata-model/tokenizer/tokenizer.json');
    console.log('Tokenizer downloaded to:', localTokenizerPath);

    const tokenizerData = await fs.readFile(localTokenizerPath, 'utf8');
    tokenizer = JSON.parse(tokenizerData);
    console.log('Tokenizer loaded successfully');
  } catch (error) {
    console.error('Error loading the tokenizer from GCS:', error);
    throw new Error('Tokenizer loading failed');
  }
};

/**
 * Fungsi untuk memuat embeddings dari file yang diunduh dari GCS.
 */
const loadEmbeddings = async () => {
  try {
    console.log('Downloading embeddings from GCS...');
    const localEmbeddingsPath = await downloadEmbeddingsFileFromGCS('advokata-model/embeddings/embeddings.json');
    console.log('Embeddings downloaded to:', localEmbeddingsPath);

    const embeddingsData = await fs.readFile(localEmbeddingsPath, 'utf8');
    embeddings = JSON.parse(embeddingsData);
    console.log('Embeddings loaded successfully:', embeddings);
    return embeddings;
  } catch (error) {
    console.error('Error loading the embeddings from GCS:', error);
    throw new Error('Embeddings loading failed');
  }
};

/**
 * Fungsi untuk memuat model dari GCS.
 */
const loadModel = async () => {
  try {
    console.log('Downloading model from GCS...');
    // Unduh file model.json dan file shard seperti model-shard2
    const localModelJsonPath = await downloadModelFilesFromGCS('advokata-model/tfjs-model');
    console.log('Model JSON downloaded to:', localModelJsonPath);

    // Pastikan model JSON berada di tempat yang benar bersama shard-nya (misalnya model-shard2)
    const modelUrl = `file://${localModelJsonPath}`;
    model = await tf.loadGraphModel(modelUrl);
    console.log('Model loaded successfully');
    return model;
  } catch (error) {
    console.error('Error loading the model from GCS:', error);
    throw new Error('Model loading failed');
  }
};

/**
 * Fungsi untuk men-tokenize pertanyaan.
 */
const tokenizeQuestion = (question) => {
  console.log('Original Question:', question);

  const tokens = question.split(' ').map((word) => {
    const token = tokenizer[word] || tokenizer['<unk>'] || 0;
    console.log(`Word: "${word}", Token: ${token}`);
    return token;
  });

  // Pastikan panjang tensor tokenisasi sesuai dengan embedding yang diharapkan
  const tokenTensor = tf.tensor2d([tokens], [1, tokens.length], 'int32'); // Pastikan tensor bertipe int32

  // Jika dimensi token terlalu kecil, tambahkan padding
  const desiredLength = 768; // Sesuaikan dengan panjang embedding yang Anda inginkan
  if (tokenTensor.shape[1] < desiredLength) {
    const padding = tf.zeros([1, desiredLength - tokenTensor.shape[1]], 'int32'); // Padding dalam bentuk int32
    tokenTensor.concat(padding, 1); // Padding di bagian akhir tensor
  }

  console.log('Tokenized Question (Tensor):', tokenTensor.toString());

  return tokenTensor;
};


/**
 * Fungsi untuk menghitung cosine similarity.
 */
const calculateCosineSimilarity = async (a, b) => {
  try {
    const a1D = a.squeeze();
    const b1D = b.squeeze();

    // Padding agar kedua tensor memiliki panjang yang sama
    const maxLength = Math.max(a1D.shape[0], b1D.shape[0]);
    const paddedA = tf.pad(a1D, [[0, maxLength - a1D.shape[0]]]);
    const paddedB = tf.pad(b1D, [[0, maxLength - b1D.shape[0]]]);

    console.log('Padded A Shape:', paddedA.shape);
    console.log('Padded B Shape:', paddedB.shape);

    // Hitung dot product dan norma dari kedua tensor
    const dotProduct = await paddedA.dot(paddedB).data();
    const normA = await paddedA.norm().data();
    const normB = await paddedB.norm().data();

    // Hitung cosine similarity
    const similarity = dotProduct[0] / (normA[0] * normB[0]);

    // Buang tensor untuk menghindari memory leak
    tf.dispose([a1D, b1D, paddedA, paddedB]);

    return similarity;
  } catch (error) {
    console.error('Error in calculateCosineSimilarity:', error);
    throw error;
  }
};

/**
 * Fungsi untuk mencari konteks yang relevan berdasarkan token pertanyaan.
 */
const searchContext = async (tokenizedQuestion) => {
  try {
    console.log('Searching for context for tokenized question:', tokenizedQuestion);

    if (!Array.isArray(embeddings)) {
      throw new Error('Embeddings should be an array');
    }

    let bestMatch = null;
    let highestSimilarity = -1;

    const tokenizedTensor1D = tokenizedQuestion.squeeze();

    for (const embedding of embeddings) {
      const embeddingVector = Array.isArray(embedding.tokens) ? embedding.tokens : embedding.vector;

      if (!embeddingVector || !Array.isArray(embeddingVector)) {
        console.error('Invalid embedding:', embedding);
        continue;
      }

      const embeddingTensor = tf.tensor(embeddingVector).squeeze();

      try {
        const similarity = await calculateCosineSimilarity(tokenizedTensor1D, embeddingTensor);
        console.log(`Similarity with context "${embedding.context}":`, similarity);

        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = embedding;
        }
      } catch (similarityError) {
        console.error('Error calculating similarity:', similarityError);
      } finally {
        tf.dispose(embeddingTensor);
      }
    }

    tf.dispose(tokenizedTensor1D);

    if (bestMatch) {
      console.log('Best match found:', bestMatch.context);
      return bestMatch.context;
    } else {
      console.warn('No relevant context found. Returning fallback context.');
      return 'Fallback context: Tidak ada konteks yang cocok ditemukan.';
    }
  } catch (error) {
    console.error('Error during context search:', error);
    throw new Error('Context search failed');
  }
};



/**
 * Fungsi untuk menyimpan pertanyaan dan jawaban ke Firestore.
 */
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

/**
 * Fungsi untuk mendapatkan jawaban dari model berdasarkan pertanyaan.
 */
const getAnswer = async (question) => {
  if (!model) {
    throw new Error('Model is not loaded yet');
  }

  if (!tokenizer) {
    throw new Error('Tokenizer is not loaded yet');
  }

  try {
    // Tokenisasi pertanyaan
    const tokenizedQuestion = tokenizeQuestion(question);
    console.log('Tokenized Question:', tokenizedQuestion);

    // Mencari konteks yang relevan
    const context = await searchContext(tokenizedQuestion);
    console.log('Context:', context);

    // Tokenisasi konteks
    const tokenizedContext = tokenizeQuestion(context);
    console.log('Tokenized Context:', tokenizedContext);

    // Tentukan panjang maksimum yang didukung oleh model, misalnya 512
    const maxLength = 512;

    // Potong tokenizedQuestion dan tokenizedContext agar tidak melebihi panjang maksimum
    const truncatedTokenizedQuestion = truncateTensorToLength(tokenizedQuestion, maxLength);
    const truncatedTokenizedContext = truncateTensorToLength(tokenizedContext, maxLength);

    // Membuat attention mask (1 untuk token yang valid, 0 untuk padding)
    const attentionMask = tf.ones([1, truncatedTokenizedQuestion.shape[1]], 'int32');
    const tokenTypeIds = tf.zeros([1, truncatedTokenizedQuestion.shape[1]], 'int32');

    // Persiapkan input tensor
    const inputTensor = {
      'input_ids': truncatedTokenizedQuestion,  // Tokenized question yang sudah dipotong
      'attention_mask:0': attentionMask,       // Attention mask
      'token_type_ids': tokenTypeIds           // Token type IDs
    };

    console.log('Input Tensor:', inputTensor);

    // Prediksi menggunakan model
    const prediction = await model.execute(inputTensor);

    // Mengonversi hasil prediksi ke array (mengganti .data() dengan .array())
    const answerData = await prediction.array();
    const answerText = answerData.toString();

    console.log('Answer:', answerText);

    // Simpan pertanyaan dan jawaban ke Firestore
    await saveToFirestore(question, answerText);

    return answerText;
  } catch (error) {
    console.error('Error during model prediction:', error.message);
    throw new Error(`Model prediction failed: ${error.message}`);
  }
};

// Fungsi untuk memotong tensor ke panjang yang diinginkan (maxLength)
const truncateTensorToLength = (tensor, maxLength) => {
  const currentLength = tensor.shape[1];
  if (currentLength > maxLength) {
    tensor = tensor.slice([0, 0], [1, maxLength]);  // Potong tensor agar panjangnya sesuai
  }
  return tensor;
};






module.exports = { loadModel, getAnswer, loadTokenizer, loadEmbeddings };
