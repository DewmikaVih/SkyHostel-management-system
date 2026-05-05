const CanteenLog = require('../models/CanteenLog');
const CanteenMenu = require('../models/CanteenMenu');
const Notice = require('../models/Notice');

// @desc    Get menu for a specific date
// @route   GET /api/canteen/menu/:date
exports.getMenu = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    let menu = await CanteenMenu.findOne({ date });
    
    // If no menu exists, return a default or empty one
    if (!menu) {
      return res.json({
        date,
        breakfast: { items: ['Menu not set'], time: '07:30 AM - 09:00 AM' },
        lunch: { items: ['Menu not set'], time: '12:30 PM - 02:30 PM' },
        dinner: { items: ['Menu not set'], time: '07:30 PM - 09:30 PM' }
      });
    }
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set menu for a specific date (Admin)
// @route   POST /api/canteen/menu
exports.setMenu = async (req, res) => {
  const { date, breakfast, lunch, dinner } = req.body;
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let menu = await CanteenMenu.findOneAndUpdate(
      { date: targetDate },
      { breakfast, lunch, dinner },
      { new: true, upsert: true }
    );
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's selection and status for a date
// @route   GET /api/canteen/status/:date
exports.getStatus = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    const log = await CanteenLog.findOne({ date, studentId: req.user.id });
    res.json(log || { selections: {}, consumed: {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit meal selections for a date
// @route   POST /api/canteen/select
exports.submitSelection = async (req, res) => {
  const { date, selections } = req.body;
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const log = await CanteenLog.findOneAndUpdate(
      { date: targetDate, studentId: req.user.id },
      { selections },
      { new: true, upsert: true }
    );
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get total meal counts for a date (Admin)
// @route   GET /api/canteen/counts/:date
exports.getCounts = async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    
    const logs = await CanteenLog.find({ date });
    const counts = {
      breakfast: logs.filter(l => l.selections?.breakfast).length,
      lunch: logs.filter(l => l.selections?.lunch).length,
      dinner: logs.filter(l => l.selections?.dinner).length
    };
    res.json(counts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark meal as consumed (Admin/Scanner)
// @route   POST /api/canteen/consume
exports.markConsumed = async (req, res) => {
  const { studentId, mealType, date } = req.body; // mealType: 'breakfast', 'lunch', 'dinner'
  try {
    const targetDate = new Date(date || Date.now());
    targetDate.setHours(0, 0, 0, 0);

    const log = await CanteenLog.findOneAndUpdate(
      { date: targetDate, studentId },
      { [`consumed.${mealType}.time`]: new Date() },
      { new: true }
    );
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create canteen notice
// @route   POST /api/canteen/notices
exports.createNotice = async (req, res) => {
  try {
    const notice = await Notice.create({
      ...req.body,
      category: 'CANTEEN',
      authorId: req.user.id
    });
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get canteen notices
// @route   GET /api/canteen/notices
exports.getNotices = async (req, res) => {
  try {
    const notices = await Notice.find({ category: 'CANTEEN' }).sort('-createdAt');
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
