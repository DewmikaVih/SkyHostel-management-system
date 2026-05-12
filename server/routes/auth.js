const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, getUserById, searchStudents, forgotPassword, verifyOtp, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/user/:id', protect, getUserById);
router.get('/students/search', protect, searchStudents);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
