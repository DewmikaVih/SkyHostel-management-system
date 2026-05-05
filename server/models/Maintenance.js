const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  title: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'PLUMBING', 'ELECTRICAL'
  description: { type: String, required: true },
  imageUrl: { type: String }, // S3 URL
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'ASSIGNED', 'RESOLVED'], default: 'PENDING' },
  adminFeedback: { type: String },
  studentRating: { type: Number, min: 1, max: 5 },
  studentComment: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
