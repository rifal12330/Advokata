const db = require('../config/db');  // Import koneksi database dari db.js

// Fungsi untuk membuat pengguna baru
const createUser = (name, email, password, callback) => {
  // Menyisipkan pengguna baru ke dalam tabel users
  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.query(query, [name, email, password], (err, result) => {
    if (err) {
      console.error('Error inserting user:', err);
      return callback(err);
    }

    // Mengecek jika email berdomain @lawyer.com, maka insert ke tabel lawyers
    if (email.endsWith('@lawyer.com')) {
      const userId = result.insertId;  // Mengambil user_id yang baru dimasukkan
      const lawyerQuery = 'INSERT INTO lawyers (user_id, name, specialization, ktpa, ratings, experience_years, contact, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const lawyerData = [userId, name, 'Unknown', 'Unknown', 0, 0, email, true];  // Data default untuk lawyer
      
      db.query(lawyerQuery, lawyerData, (err, lawyerResult) => {
        if (err) {
          console.error('Error inserting into lawyers:', err);
          return callback(err);
        }
        callback(null, result);  // Kembalikan hasil registrasi pengguna
      });
    } else {
      callback(null, result);  // Kembalikan hasil registrasi pengguna tanpa input ke lawyers
    }
  });
};

// Fungsi untuk menemukan pengguna berdasarkan email
const findUserByEmail = (email, callback) => {
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, result) => {
    if (err) {
      console.error('Error finding user:', err);
      return callback(err);
    }
    callback(null, result[0]);  // Mengambil user pertama (jika ada)
  });
};

// Fungsi untuk mendapatkan semua pengguna
const getAllUsers = (callback) => {
  const query = 'SELECT * FROM users';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error retrieving users:', err);
      return callback(err);
    }
    callback(null, result);
  });
};

module.exports = { createUser, findUserByEmail, getAllUsers };
