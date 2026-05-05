const express = require('express');
const router = express.Router();
const { postNotice, getNotices, deleteNotice } = require('../controllers/noticeController');
const { protect, admin } = require('../middleware/authMiddleware');

// Notice Routes
router.post('/notices', protect, admin, postNotice);
router.get('/notices', protect, getNotices);
router.delete('/notices/:id', protect, admin, deleteNotice);

module.exports = router;
