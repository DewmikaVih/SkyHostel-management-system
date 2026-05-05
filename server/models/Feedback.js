const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  comment: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'HIDDEN'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
