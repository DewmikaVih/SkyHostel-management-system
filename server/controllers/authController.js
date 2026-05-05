const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
