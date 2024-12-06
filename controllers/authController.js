const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/userModel'); // Import fungsi dari model

// Register
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Hash password sebelum menyimpannya
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan pengguna baru ke database
    createUser(name, email, hashedPassword, (err, result) => {
      if (err) {
        return res.status(500).json({ error: true, message: 'Error registering user' });
      }
      res.status(201).json({ error: false, message: 'User registered successfully' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: 'Error registering user' });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Cari user berdasarkan email
    findUserByEmail(email, async (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: true, message: 'User not found' });
      }

      // Bandingkan password yang dimasukkan dengan hash password di database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: true, message: 'Invalid credentials' });
      }

      // Buat token JWT jika login berhasil
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      res.json({
        error: false,
        message: 'Login successful!',
        loginResult: {
          userId: user.id,
          name: user.name,
          token,
        },
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: true, message: 'Error logging in' });
  }
};

// Logout
const logout = (req, res) => {
  res.json({ error: false, message: 'Logged out successfully' });
};

module.exports = { register, login, logout };
