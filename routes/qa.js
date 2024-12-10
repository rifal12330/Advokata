// routes/qa.js

const express = require('express');
const router = express.Router();
const { getAnswer } = require('../services/qaService');
require('dotenv').config();


router.post('/predict', async (req, res) => {
  try {
    console.log('Request body:', req.body);

    const { questionTensor } = req.body;

    if (!questionTensor) {
      return res.status(400).json({ error: 'questionTensor is required' });
    }

    console.log('Received questionTensor:', questionTensor);

    // Get the answer based on the input tensor
    const answer = await getAnswer(questionTensor);
    console.log('Generated answer:', answer);

    res.json({ answer });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
