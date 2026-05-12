const Notice = require('../models/Notice');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @desc    Post a notice (Admin only)
// @route   POST /api/notices
exports.postNotice = async (req, res) => {
  const { title, content, category, targetYear, targetFaculty, isPinned, sendEmail: shouldSendEmail } = req.body;
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
      sendEmail: shouldSendEmail || false,
      isVerified: true
    });

    if (shouldSendEmail) {
      // Find students matching year/faculty
      const filter = { role: 'STUDENT' };
      if (targetYear && targetYear !== 'All') filter.academicYear = targetYear;
      if (targetFaculty && targetFaculty !== 'All') filter.targetFaculty = targetFaculty;

      const students = await User.find(filter).select('email fullName');

      // BroadCast Email
      const emailPromises = students.map(student => {
        const message = `
          <div style="font-family: sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 600px;">
            <div style="background: #003B46; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; margin: -20px -20px 20px -20px;">
              <h2 style="margin: 0;">SkyHostel Announcement</h2>
            </div>
            <h3 style="color: #003B46;">${title}</h3>
            <p style="color: #555; line-height: 1.6;">${content}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888;">This is an automated alert sent to residents of ${targetFaculty} (${targetYear}). Please check your dashboard for more details.</p>
          </div>
        `;

        return sendEmail({
          email: student.email,
          subject: `[SkyHostel Alert] ${title}`,
          message
        }).catch(err => console.error(`Failed to send notice email to ${student.email}:`, err));
      });

      await Promise.all(emailPromises);
      console.log(`[EMAIL SYSTEM] Notice broadcast to ${students.length} students.`);
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
