const express = require('express');
const router = express.Router();
const { 
  requestPass, 
  getMyPasses, 
  getAllPasses, 
  updatePassStatus, 
  markAttendance,
  getRecentAttendance,
  getStudentLateEntriesDetail,
  getCurfewViolators,
  deletePass
} = require('../controllers/visitorController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, requestPass);
router.get('/my-passes', protect, getMyPasses);
router.get('/', protect, admin, getAllPasses);
router.get('/attendance/history', protect, admin, getRecentAttendance);
router.get('/attendance/late-details', protect, getStudentLateEntriesDetail);
router.get('/attendance/violators', protect, admin, getCurfewViolators);
router.put('/:id/status', protect, admin, updatePassStatus);
router.delete('/:id', protect, admin, deletePass);
router.post('/attendance', protect, markAttendance);

module.exports = router;
