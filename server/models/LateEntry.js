const mongoose = require('mongoose');

const lateEntrySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  time: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('LateEntry', lateEntrySchema);
