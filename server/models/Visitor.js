const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visitorName: { type: String, required: true },
  visitorPhone: { type: String },
  relationship: { type: String, required: true },
  purpose: { type: String, required: true },
  visitDate: { type: Date, required: true },
  timeIn: { type: String }, // e.g., '14:30'
  timeOut: { type: String },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXITED'], default: 'PENDING' },
  qrCodeUrl: { type: String },
  rejectionReason: { type: String },
  actualEntryTime: { type: Date },
  actualExitTime: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);
