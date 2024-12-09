// routes/qa.js
const express = require('express');
const router = express.Router();
const { getAnswer } = require('../services/qaService');
const tf = require('@tensorflow/tfjs-node');

router.post('/predict', async (req, res) => {
  try {
    const { questionTensor } = req.body; // Asumsikan input dalam bentuk array

    // Konversi input menjadi tensor
    const inputTensor = tf.tensor(questionTensor);

    const answer = await getAnswer(inputTensor);
    res.json({ answer });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
