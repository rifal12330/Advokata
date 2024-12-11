// routes/qa.js

global.self = global;
const express = require('express');
const router = express.Router();
const { getAnswer } = require('../services/qaService');
require('dotenv').config();

router.post('/predict', async (req, res) => {
  try {
    // Log request body for debugging
    console.log('Received request body:', req.body);

    const { question } = req.body; // Changed to accept the raw question

    // Validate the input data
    if (!question) {
      console.error('Error: question is required');
      return res.status(400).json({ error: 'question is required' });
    }

    // Log the received question
    console.log('Received question:', question);

    // Get the answer based on the input question
    const answer = await getAnswer(question);
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
