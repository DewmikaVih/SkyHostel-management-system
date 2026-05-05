const express = require('express');
const router = express.Router();
const { 
  createTicket, 
  getMyTickets, 
  getAllTickets, 
  updateTicket, 
  submitFeedback,
  deleteTicket
} = require('../controllers/maintenanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createTicket);
router.get('/my-tickets', protect, getMyTickets);
router.get('/', protect, admin, getAllTickets);
router.put('/:id', protect, admin, updateTicket);
router.put('/:id/feedback', protect, submitFeedback);
router.delete('/:id', protect, admin, deleteTicket);

module.exports = router;
