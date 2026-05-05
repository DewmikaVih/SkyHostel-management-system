const Notice = require('../models/Notice');

// @desc    Post a notice (Admin only)
// @route   POST /api/notices
exports.postNotice = async (req, res) => {
  const { title, content, category, targetYear, targetFaculty, isPinned, sendEmail } = req.body;
  const authorId = req.user.id;

  try {
    const notice = await Notice.create({
      authorId,
      title,
      content,
      category,
      targetYear: targetYear || 'All',
      targetFaculty: targetFaculty || 'All',
      isPinned: isPinned || false,
      sendEmail: sendEmail || false,
      isVerified: true
    });

    if (sendEmail) {
      // Simulate sending emails to students matching year/faculty
      console.log(`[EMAIL SYSTEM] Sending notice "${title}" to students in ${targetFaculty}, ${targetYear}`);
    }

    // Notify all students via socket
    const io = req.app.get('socketio');
    if (io) io.emit('new_notice', notice);

    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all notices
// @route   GET /api/notices
exports.getNotices = async (req, res) => {
  try {
    const { category, year, faculty } = req.query;
    const query = {};
    if (category) query.category = category;
    if (year && year !== 'All') query.targetYear = year;
    if (faculty && faculty !== 'All') query.targetFaculty = faculty;

    const notices = await Notice.find(query)
      .populate('authorId', 'fullName adminType')
      .sort('-isPinned -createdAt');
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete notice (Admin only)
// @route   DELETE /api/notices/:id
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    
    await notice.deleteOne();
    res.json({ message: 'Notice removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
