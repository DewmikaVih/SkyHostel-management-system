const mongoose = require('mongoose');

const canteenMenuSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  breakfast: {
    items: [String],
    time: { type: String, default: '07:30 AM - 09:00 AM' }
  },
  lunch: {
    items: [String],
    time: { type: String, default: '12:30 PM - 02:30 PM' }
  },
  dinner: {
    items: [String],
    time: { type: String, default: '07:30 PM - 09:30 PM' }
  }
}, { timestamps: true });

module.exports = mongoose.model('CanteenMenu', canteenMenuSchema);
