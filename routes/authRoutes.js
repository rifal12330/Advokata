// authRoutes.js
const express = require('express');
const { register, login, logout, upload, updateProfilePicture, getUsers, getLawyers } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware to verify JWT token
const router = express.Router();


router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile-picture', authMiddleware, upload.single('photo'), updateProfilePicture);
router.get('/getUsers', getUsers);
router.get('/getLawyers', getLawyers);
module.exports = router;