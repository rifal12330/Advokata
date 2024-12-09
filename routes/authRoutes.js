// authRoutes.js
const express = require('express');
const { register, login, logout, upload, updateProfilePicture, getUser, getLawyer } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware to verify JWT token
const router = express.Router();


router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile-picture', authMiddleware, upload.single('photo'), updateProfilePicture);
router.get('/getUsers/:email', getUser);
router.get('/getLawyer:email', getLawyer);
module.exports = router;