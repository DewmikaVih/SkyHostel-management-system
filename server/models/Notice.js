const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['URGENT', 'GENERAL', 'CANTEEN', 'POLICY'], default: 'GENERAL' },
  targetYear: { type: String, default: 'All' },
  targetFaculty: { type: String, default: 'All' },
  isPinned: { type: Boolean, default: false },
  sendEmail: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
