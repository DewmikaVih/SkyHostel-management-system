const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  role: { type: String, enum: ['STUDENT', 'ADMIN'], default: 'STUDENT' },
  
  // Student specific fields
  regNumber: { type: String, unique: true, sparse: true },
  faculty: { type: String },
  academicYear: { type: String },
  assignedRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  status: { type: String, enum: ['IN_HOSTEL', 'OUT'], default: 'IN_HOSTEL' },
  lateEntries: { type: Number, default: 0 }, // Total
  monthlyLateEntries: { type: Number, default: 0 }, // Reset monthly
  lastResetMonth: { type: Number, default: new Date().getMonth() }, 
  leavesTaken: { type: Number, default: 0 },
  penaltyBalance: { type: Number, default: 0 },
  lastMarkOut: { type: Date },
  qrCodeUrl: { type: String },
  profilePicture: { type: String },
  dob: { type: String },
  gender: { type: String },
  nic: { type: String },
  homeAddress: { type: String },
  emergencyContact: {
    name: { type: String },
    relationship: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  
  // Admin specific fields
  staffId: { type: String, unique: true, sparse: true },
  adminType: { type: String, enum: ['WARDEN', 'CANTEEN', 'MAINTENANCE', 'SUPER'], default: 'WARDEN' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
