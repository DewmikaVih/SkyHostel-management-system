const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  const { fullName, email, password, role, regNumber, staffId, faculty, academicYear, phoneNumber } = req.body;

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      regNumber,
      staffId,
      faculty,
      academicYear,
      phoneNumber
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        regNumber: user.regNumber,
        assignedRoomId: user.assignedRoomId,
        status: user.status,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user (Login)
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { identifier, password, role } = req.body; 

  try {
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { regNumber: identifier },
        { staffId: identifier }
      ],
      role: role // Strict role check
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        regNumber: user.regNumber,
        staffId: user.staffId,
        assignedRoomId: user.assignedRoomId,
        status: user.status,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: `Invalid credentials for ${role} portal` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { 
      fullName, phoneNumber, profilePicture, password,
      dob, gender, nic, homeAddress, emergencyContact,
      faculty, academicYear 
    } = req.body;

    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (profilePicture) user.profilePicture = profilePicture;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;
    if (nic) user.nic = nic;
    if (homeAddress) user.homeAddress = homeAddress;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    if (faculty) user.faculty = faculty;
    if (academicYear) user.academicYear = academicYear;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      role: updatedUser.role,
      phoneNumber: updatedUser.phoneNumber,
      profilePicture: updatedUser.profilePicture,
      dob: updatedUser.dob,
      gender: updatedUser.gender,
      nic: updatedUser.nic,
      homeAddress: updatedUser.homeAddress,
      emergencyContact: updatedUser.emergencyContact,
      faculty: updatedUser.faculty,
      academicYear: updatedUser.academicYear,
      assignedRoomId: updatedUser.assignedRoomId,
      status: updatedUser.status
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID (Admin)
// @route   GET /api/auth/user/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Search students (Admin)
// @route   GET /api/auth/students/search
exports.searchStudents = async (req, res) => {
  const { query } = req.query;
  try {
    const students = await User.find({
      role: 'STUDENT',
      $or: [
        { fullName: { $regex: query, $options: 'i' } },
        { regNumber: { $regex: query, $options: 'i' } }
      ]
    }).select('fullName regNumber _id').limit(10);
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { identifier, role } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { regNumber: identifier }, { staffId: identifier }],
      role: role
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found with those details' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save();

    // Send Email
    const message = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #003B46;">SkyHostel Password Reset</h2>
        <p>You requested a password reset for your account. Please use the following One-Time Password (OTP) to verify your identity:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #003B46;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'SkyHostel Password Reset OTP',
        message
      });

      res.json({ message: 'OTP sent to registered email' });
    } catch (err) {
      user.resetOtp = undefined;
      user.resetOtpExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP - Generate Reset Link
// @route   POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  const { identifier, otp, role } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { regNumber: identifier }, { staffId: identifier }],
      role: role,
      resetOtp: otp,
      resetOtpExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Generate Reset Token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 30 * 60 * 1000; // 30 mins
    user.resetOtp = undefined;
    user.resetOtpExpire = undefined;
    await user.save();

    // Send Verification Email with Link
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const message = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #003B46;">Identity Verified</h2>
        <p>Your OTP has been verified successfully. Click the button below to set a new password for your SkyHostel account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #003B46; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">The link is valid for 30 minutes. If you did not request this, please contact support.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'SkyHostel Password Reset Link',
      message
    });

    res.json({ message: 'Identity verified. Reset link sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
