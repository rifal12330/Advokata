const mysql = require('mysql2');

// Membuat koneksi dengan Cloud SQL menggunakan Unix socket
const connection = mysql.createConnection({
  user: process.env.DB_USER,                  // Database user
  password: process.env.DB_PASSWORD,          // Database password
  database: process.env.DB_NAME,              // Database name
  socketPath: `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`, // Cloud SQL connection path
});

// Memastikan koneksi berhasil
connection.connect((err) => {
  if (err) {
    console.error('Unable to connect to the database:', err.message);
    process.exit(1);
  }
  console.log('Database connection established successfully');
});

module.exports = connection;
