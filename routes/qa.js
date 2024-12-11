// routes/qa.js
global.self = global;
const tflite = require('@tensorflow/tfjs-tflite');
const express = require('express');
const router = express.Router();
const { getAnswer } = require('../services/qaService');
require('dotenv').config();

router.post('/predict', async (req, res) => {
  try {
    // Log request body for debugging
    console.log('Received request body:', req.body);

    const { questionTensor } = req.body;

    // Validate the input data
    if (!questionTensor) {
      console.error('Error: questionTensor is required');
      return res.status(400).json({ error: 'questionTensor is required' });
    }

    // Log the received question tensor
    console.log('Received questionTensor:', questionTensor);

    // Get the answer based on the input tensor
    const answer = await getAnswer(questionTensor);
    console.log('Generated answer:', answer);

    // Send the response with the generated answer
    return res.json({ answer });
  } catch (error) {
    console.error('Error processing the request:', error);

    // Log the complete error stack for debugging
    console.error('Error stack:', error.stack);

    // Send an error response with a proper status code
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
