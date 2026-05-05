const express = require('express');
const router = express.Router();
const { postNotice, getNotices, deleteNotice } = require('../controllers/noticeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, postNotice);
router.get('/', getNotices);
router.delete('/:id', protect, admin, deleteNotice);

module.exports = router;
