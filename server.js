// app.js
global.self = global; // Polyfill untuk self

const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const qaRoutes = require('./routes/qa');
const { loadModel } = require('./services/qaService');
dotenv.config();

const app = express();

// Middleware untuk parsing JSON body
app.use(bodyParser.json());

// Tunggu model selesai dimuat sebelum menjalankan server
loadModel()
  .then(() => {
    console.log('Model loaded successfully');

    // Gunakan route untuk QA
    app.use('/api', qaRoutes);

    // Main route untuk memverifikasi server berjalan
    app.get('/', (req, res) => {
      res.send('Hello, World!');
    });

    // Menangani error global
    app.use((err, req, res, next) => {
      console.error('Global error handler:', err.stack);
      res.status(500).json({ message: 'Something went wrong!', error: err.message });
    });

    // Tentukan port untuk server
    const PORT = process.env.PORT || 8080;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.setTimeout(300000); // Set timeout ke 5 menit (300000 ms)
  })
  .catch((err) => {
    console.error('Error loading model:', err);
    process.exit(1); // Keluar jika gagal memuat model
  });
