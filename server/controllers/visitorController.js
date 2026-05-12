const Visitor = require('../models/Visitor');
const User = require('../models/User');
const LateEntry = require('../models/LateEntry');
const Fine = require('../models/Fine');

// @desc    Request new visitor pass
// @route   POST /api/visitors
exports.requestPass = async (req, res) => {
  const { visitorName, visitorPhone, relationship, purpose, visitDate, timeIn, timeOut } = req.body;
  const studentId = req.user.id;

  try {
    const pass = await Visitor.create({
      studentId,
      visitorName,
      visitorPhone,
      relationship,
      purpose,
      visitDate,
      timeIn,
      timeOut
    });
    res.status(201).json(pass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's own visitor passes
// @route   GET /api/visitors/my-passes
exports.getMyPasses = async (req, res) => {
  try {
    const passes = await Visitor.find({ studentId: req.user.id }).sort('-createdAt');
    res.json(passes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all visitor passes (Admin only)
// @route   GET /api/visitors
exports.getAllPasses = async (req, res) => {
  try {
    const passes = await Visitor.find().populate('studentId', 'fullName regNumber').sort('-createdAt');
    res.json(passes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update pass status (Admin only - Approve/Reject/Exit)
// @route   PUT /api/visitors/:id/status
exports.updatePassStatus = async (req, res) => {
  const { status, rejectionReason } = req.body;
  try {
    const pass = await Visitor.findById(req.params.id);
    if (!pass) return res.status(404).json({ message: 'Pass not found' });

    pass.status = status;
    if (status === 'REJECTED') {
      pass.rejectionReason = rejectionReason;
    } else if (status === 'EXITED') {
      pass.actualExitTime = Date.now();
    }

    await pass.save();
    res.json(pass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark attendance (In/Out) - Student Dashboard
// @route   POST /api/visitors/attendance
exports.markAttendance = async (req, res) => {
  const { type } = req.body; // 'IN' or 'OUT'
  const studentId = req.user.id;

  try {
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const now = new Date();
    const io = req.app.get('socketio');
    const currentMonth = now.getMonth();

    // Monthly Reset Logic
    if (student.lastResetMonth !== currentMonth) {
      student.monthlyLateEntries = 0;
      student.lastResetMonth = currentMonth;
    }

    if (type === 'OUT') {
      student.status = 'OUT';
      student.lastMarkOut = now;
      
      if (io) io.emit('attendance_alert', { 
        studentName: student.fullName, 
        regNumber: student.regNumber,
        type: 'OUT',
        statusLabel: 'GoOut',
        color: 'green',
        time: now
      });
    } else {
      // Logic for MARK IN
      const outTime = student.lastMarkOut ? new Date(student.lastMarkOut) : null;
      const isSameDay = outTime && outTime.toDateString() === now.toDateString();
      const hours = now.getHours();
      
      let statusLabel = 'ComeBack';
      let color = 'green';
      let isLate = false;

      // Rule: Before 11:59 PM (on the same day or generally before midnight)
      if (hours >= 0 && hours < 3) {
        // Between 12:00 AM and 3:00 AM
        statusLabel = 'LateEntry';
        color = 'red';
        isLate = true;
      } else if (!isSameDay && outTime) {
        // If it's a different day and not in the 12-3AM window, it's definitely late or even "Not Come"
        // But if they are clicking now, they ARE coming back, so we mark it as Late if it's after midnight
        statusLabel = 'LateEntry';
        color = 'red';
        isLate = true;
      }

      student.status = 'IN_HOSTEL';
      
      if (isLate) {
        student.lateEntries += 1;
        student.monthlyLateEntries += 1;
        await LateEntry.create({ studentId: student._id, time: now });

        if (student.monthlyLateEntries === 7) {
          const systemAdmin = await User.findOne({ role: 'ADMIN' });
          await Fine.create({
            student: student._id,
            admin: systemAdmin ? systemAdmin._id : student._id,
            amount: 250,
            reason: '7 Late Entries in a single month',
            status: 'UNPAID'
          });
          student.penaltyBalance = (student.penaltyBalance || 0) + 250;
        }
      }

      if (io) io.emit('attendance_alert', { 
        studentName: student.fullName, 
        regNumber: student.regNumber, 
        type: 'IN',
        statusLabel: statusLabel,
        color: color,
        time: now
      });
    }

    await student.save();
    res.json({ 
      message: `Successfully marked as ${type}`, 
      status: student.status, 
      lateEntries: student.lateEntries,
      monthlyLateEntries: student.monthlyLateEntries
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student late entries detail
// @route   GET /api/visitors/attendance/late-details
exports.getStudentLateEntriesDetail = async (req, res) => {
  try {
    const details = await LateEntry.find({ studentId: req.user.id }).sort('-createdAt');
    res.json(details);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get curfew violators (Admin only)
// @route   GET /api/visitors/attendance/violators
exports.getCurfewViolators = async (req, res) => {
  try {
    const violators = await User.find({ 
      role: 'STUDENT', 
      monthlyLateEntries: { $gte: 7 } 
    }).select('fullName regNumber monthlyLateEntries penaltyBalance');
    res.json(violators);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent attendance movements
// @route   GET /api/visitors/attendance/history
exports.getRecentAttendance = async (req, res) => {
  try {
    const students = await User.find({ status: { $exists: true } })
      .sort({ updatedAt: -1 })
      .limit(50)
      .select('fullName regNumber status updatedAt lastMarkOut');
    
    const now = new Date();
    const movements = students.map(s => {
      const lastMove = new Date(s.updatedAt);
      const markOutTime = s.lastMarkOut ? new Date(s.lastMarkOut) : null;
      
      let statusLabel = s.status === 'IN_HOSTEL' ? 'ComeBack' : 'GoOut';
      let color = 'green';

      if (s.status === 'IN_HOSTEL') {
        // If they marked IN, check if it was late
        const moveHours = lastMove.getHours();
        const markOutDay = markOutTime ? markOutTime.toDateString() : null;
        const markInDay = lastMove.toDateString();
        
        if (moveHours >= 0 && moveHours < 3) {
          statusLabel = 'LateEntry';
          color = 'red';
        } else if (markOutDay && markOutDay !== markInDay) {
          statusLabel = 'LateEntry';
          color = 'red';
        }
      } else if (s.status === 'OUT') {
        // If they are currently OUT, check if they are now "Not Come"
        // Condition: Current time is after 3:00 AM and it's not the same day they went out
        if (now.getHours() >= 3) {
          const today = now.toDateString();
          const outDay = markOutTime ? markOutTime.toDateString() : null;
          if (outDay && outDay !== today) {
            statusLabel = 'Not Come';
            color = 'orange'; // Warning color
          }
        }
      }
      
      return {
        id: s._id,
        studentName: s.fullName,
        regNumber: s.regNumber,
        type: s.status === 'IN_HOSTEL' ? 'IN' : 'OUT',
        time: s.updatedAt,
        statusLabel: statusLabel,
        color: color
      };
    });

    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete visitor pass (Admin only)
// @route   DELETE /api/visitors/:id
exports.deletePass = async (req, res) => {
  try {
    const pass = await Visitor.findById(req.params.id);
    if (!pass) return res.status(404).json({ message: 'Pass not found' });

    await pass.deleteOne();
    res.json({ message: 'Visitor pass deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
