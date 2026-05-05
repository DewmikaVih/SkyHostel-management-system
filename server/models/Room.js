const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  floor: { type: String, required: true },
  wing: { type: String, required: true },
  type: { type: String, enum: ['SINGLE', 'DOUBLE', 'QUAD'], required: true },
  capacity: { type: Number, required: true },
  occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'CLEANING', 'RESTRICTED'], default: 'AVAILABLE' },
  amenities: [{ type: String }], // e.g., ['WIFI', 'AC', 'LOCKER']
  lastCleaned: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
