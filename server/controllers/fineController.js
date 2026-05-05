const Fine = require('../models/Fine');
const User = require('../models/User');

// @desc    Issue a new fine to a student
// @route   POST /api/fines
exports.issueFine = async (req, res) => {
  const { studentId, amount, reason } = req.body;

  try {
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const fine = await Fine.create({
      student: studentId,
      admin: req.user.id,
      amount,
      reason
    });

    // Update student's penalty balance
    student.penaltyBalance = (student.penaltyBalance || 0) + Number(amount);
    await student.save();

    res.status(201).json(fine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all fines
// @route   GET /api/fines
exports.getAllFines = async (req, res) => {
  try {
    const fines = await Fine.find()
      .populate('student', 'fullName regNumber')
      .populate('admin', 'fullName role')
      .sort('-createdAt');
    res.json(fines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get fines for a specific student
// @route   GET /api/fines/student/:id
exports.getStudentFines = async (req, res) => {
  try {
    const fines = await Fine.find({ student: req.params.id }).sort('-createdAt');
    res.json(fines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload payment slip for a fine
// @route   PUT /api/fines/:id/pay
exports.uploadPaymentSlip = async (req, res) => {
  const { paymentSlip } = req.body;
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    
    fine.paymentSlip = paymentSlip;
    fine.status = 'PENDING';
    await fine.save();
    
    res.json(fine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify and approve payment
// @route   PUT /api/fines/:id/verify
exports.verifyPayment = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Fine not found' });
    
    if (fine.status === 'PAID') return res.status(400).json({ message: 'Already paid' });

    fine.status = 'PAID';
    fine.paidAt = new Date();
    await fine.save();

    // Subtract from student's penalty balance
    const student = await User.findById(fine.student);
    if (student) {
      student.penaltyBalance = Math.max(0, (student.penaltyBalance || 0) - fine.amount);
      await student.save();
    }

    res.json(fine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a fine (Admin only)
// @route   DELETE /api/fines/:id
exports.deleteFine = async (req, res) => {
  try {
    const fine = await Fine.findById(req.params.id);
    if (!fine) return res.status(404).json({ message: 'Fine not found' });

    await fine.deleteOne();
    res.json({ message: 'Fine record removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
