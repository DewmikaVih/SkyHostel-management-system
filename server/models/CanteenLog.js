const mongoose = require('mongoose');

const canteenLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selections: {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false }
  },
  consumed: {
    breakfast: { time: Date },
    lunch: { time: Date },
    dinner: { time: Date }
  }
}, { timestamps: true });

// Ensure one log per student per day
canteenLogSchema.index({ date: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('CanteenLog', canteenLogSchema);
