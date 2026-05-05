const Feedback = require('../models/Feedback');

// @desc    Submit new feedback
// @route   POST /api/feedback
exports.createFeedback = async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const feedback = await Feedback.create({
      studentId: req.user.id,
      fullName: req.user.fullName,
      comment,
      rating
    });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all feedbacks
// @route   GET /api/feedback
exports.getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('studentId', 'fullName profilePicture')
      .sort('-createdAt');
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
