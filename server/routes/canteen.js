const express = require('express');
const router = express.Router();
const { 
  getMenu, setMenu, getStatus, submitSelection, 
  getCounts, markConsumed, createNotice, getNotices 
} = require('../controllers/canteenController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/menu/:date', protect, getMenu);
router.post('/menu', protect, admin, setMenu);

router.get('/status/:date', protect, getStatus);
router.post('/select', protect, submitSelection);

router.get('/counts/:date', protect, admin, getCounts);
router.post('/consume', protect, admin, markConsumed);

router.get('/notices', protect, getNotices);
router.post('/notices', protect, admin, createNotice);

module.exports = router;
