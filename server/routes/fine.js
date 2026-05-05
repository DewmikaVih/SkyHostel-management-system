const express = require('express');
const router = express.Router();
const { issueFine, getAllFines, getStudentFines, uploadPaymentSlip, verifyPayment, deleteFine } = require('../controllers/fineController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, issueFine);
router.get('/', protect, getAllFines);
router.get('/student/:id', protect, getStudentFines);
router.put('/:id/pay', protect, uploadPaymentSlip);
router.put('/:id/verify', protect, verifyPayment);
router.delete('/:id', protect, deleteFine);

module.exports = router;
