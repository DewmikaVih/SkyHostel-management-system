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
    const currentMonth = now.getMonth();
    const io = req.app.get('socketio');

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
        time: now,
        note: "On Time"
      });
    } else {
      // Logic for MARK IN
      student.status = 'IN_HOSTEL';
      
      // LATE ENTRY LOGIC: If marking IN after 11:59 PM (00:00 - 05:00) 
      const isAfterMidnight = now.getHours() >= 0 && now.getHours() < 5; 
      let isLate = false;

      if (isAfterMidnight) {
        isLate = true;
      } else if (student.lastMarkOut) {
        const outDate = new Date(student.lastMarkOut).toDateString();
        const inDate = now.toDateString();
        if (outDate !== inDate) isLate = true;
      }

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
            reason: 'Threshold Exceeded: 7 Late Entries in a single month',
            status: 'UNPAID'
          });
          student.penaltyBalance = (student.penaltyBalance || 0) + 250;
        }

        if (io) io.emit('curfew_violation', { 
          studentName: student.fullName, 
          regNumber: student.regNumber, 
          time: now, 
          entries: student.monthlyLateEntries,
          note: "Late Entry"
        });
      }
      
      const note = isLate ? "Late Entry" : "On Time";
      if (io) io.emit('attendance_alert', { 
        studentName: student.fullName, 
        regNumber: student.regNumber, 
        type: 'IN', 
        time: now,
        note: note
      });
    }

    await student.save();
    res.json({ 
      message: `Marked as ${student.status}`, 
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
      .limit(20)
      .select('fullName regNumber status updatedAt');
    
    const movements = students.map(s => {
      const moveTime = new Date(s.updatedAt);
      const hours = moveTime.getHours();
      const isLateTime = hours >= 0 && hours < 5;
      
      return {
        id: s._id,
        studentName: s.fullName,
        regNumber: s.regNumber,
        type: s.status === 'IN_HOSTEL' ? 'IN' : 'OUT',
        time: s.updatedAt,
        note: (s.status === 'IN_HOSTEL' && isLateTime) ? "Late Entry" : "On Time"
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
