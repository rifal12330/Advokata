// server.js

const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const qaRoutes = require('./routes/qa');
const { loadModel } = require('./services/qaService');
const tflite = require('@tensorflow/tfjs-tflite');

dotenv.config();

const app = express();

// Middleware for parsing JSON body
app.use(bodyParser.json());

// Load models from GCS when the server starts
loadModel()
  .then(() => {
    console.log('Models loaded successfully');
  })
  .catch((err) => {
    console.error('Error loading models:', err);
    process.exit(1); // Exit the process if model loading fails
  });

// Routes for authentication and QA
app.use('/api/auth', authRoutes);
app.use('/api', qaRoutes);

// Main route for verifying server is running
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Define the port for the server
const PORT = process.env.PORT || 8080;

// Start the server
app.listen(PORT, (err) => {
  if (err) {
    console.error('Failed to start server:', err);
    process.exit(1); // Exit with status 1 if there is an error
  }
  console.log(`Server running on port ${PORT}`);
});
