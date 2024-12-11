const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const qaRoutes = require('./routes/qa');
const { loadModel } = require('./services/qaService');
dotenv.config();

const app = express();

// Middleware for parsing JSON body
app.use(bodyParser.json());

// Wait for the model to be loaded before starting the server
loadModel()
  .then(() => {
    console.log('Model loaded successfully');

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

    // Set server timeout to allow for longer model loading
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.setTimeout(300000); // Set timeout to 5 minutes (300000 ms)
  })
  .catch((err) => {
    console.error('Error loading model:', err);
    process.exit(1); // Exit if model loading fails
  });
