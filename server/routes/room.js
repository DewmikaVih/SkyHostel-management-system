const express = require('express');
const router = express.Router();
const { getRooms, getRoomById, allocateRoom, unassignStudent, updateRoomStatus, getAdminStats } = require('../controllers/roomController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getRooms);
router.get('/admin/stats', protect, admin, getAdminStats);
router.get('/:id', protect, getRoomById);
router.post('/allocate', protect, allocateRoom);
router.post('/unassign', protect, admin, unassignStudent);
router.put('/:id/status', protect, admin, updateRoomStatus);

module.exports = router;
