const Room = require('../models/Room');
const User = require('../models/User');
const Maintenance = require('../models/Maintenance');
const LateEntry = require('../models/LateEntry');

// @desc    Get all rooms (visual map data)
// @route   GET /api/rooms
exports.getRooms = async (req, res) => {
  try {
    const { floor } = req.query;
    let query = {};
    
    if (floor) {
      const paddedFloor = floor.toString().padStart(2, '0');
      // Look for both "01" and "1" formats to be safe
      query = { floor: { $in: [floor, paddedFloor] } };
    }
    
    const rooms = await Room.find(query).populate('occupants', 'fullName');
    
    if (!Array.isArray(rooms)) {
      return res.status(200).json({ rooms: [], stats: { total: 0, available: 0, occupied: 0, cleaning: 0, restricted: 0 } });
    }

    const stats = {
      total: rooms.length,
      available: rooms.filter(r => r && r.status === 'AVAILABLE').length,
      occupied: rooms.filter(r => r && r.status === 'OCCUPIED').length,
      cleaning: rooms.filter(r => r && r.status === 'CLEANING').length,
      restricted: rooms.filter(r => r && r.status === 'RESTRICTED').length
    };

    res.json({ rooms, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get room by ID
// @route   GET /api/rooms/:id
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('occupants', 'fullName');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Allocate room to student
// @route   POST /api/rooms/allocate
exports.allocateRoom = async (req, res) => {
  const { roomId } = req.body;
  const studentId = req.user.id;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.status === 'RESTRICTED' || room.status === 'CLEANING') {
      return res.status(400).json({ message: 'Room is currently unavailable' });
    }

    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({ message: 'Room is at full capacity' });
    }

    // Update student
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    if (student.assignedRoomId) {
       return res.status(400).json({ message: 'Student already has a room assigned' });
    }

    student.assignedRoomId = roomId;
    await student.save();

    // Update room
    room.occupants.push(studentId);
    if (room.occupants.length === room.capacity) {
      room.status = 'OCCUPIED';
    }
    await room.save();

    res.json({ message: 'Room allocated successfully', room });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Unassign student from room
// @route   POST /api/rooms/unassign
exports.unassignStudent = async (req, res) => {
  const { roomId, studentId } = req.body;

  try {
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.occupants = room.occupants.filter(id => id.toString() !== studentId.toString());
    if (room.status === 'OCCUPIED' && room.occupants.length < room.capacity) {
      room.status = 'AVAILABLE';
    }
    await room.save();

    const student = await User.findById(studentId);
    if (student) {
      student.assignedRoomId = null;
      await student.save();
    }

    res.json({ message: 'Student unassigned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update room status (Admin)
// @route   PUT /api/rooms/:id/status
exports.updateRoomStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.status = status;
    await room.save();

    const io = req.app.get('socketio');
    if (io) {
      io.emit('room_status_update', { roomId: room._id, status: room.status });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/rooms/admin/stats
exports.getAdminStats = async (req, res) => {
  try {
    const rooms = await Room.find();
    let totalCapacity = 0;
    let occupiedBeds = 0;

    rooms.forEach(room => {
      totalCapacity += room.capacity;
      occupiedBeds += room.occupants.length;
    });

    const totalStudents = await User.countDocuments({ role: 'STUDENT' });
    const allocatedStudentsCount = await User.countDocuments({ role: 'STUDENT', assignedRoomId: { $ne: null } });
    const pendingMaintenance = await Maintenance.countDocuments({ status: 'PENDING' });

    // Late Entries Today
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const lateEntriesToday = await LateEntry.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    // Floor-wise distribution
    const floors = [...new Set(rooms.map(r => r.floor))].sort();
    const floorStats = floors.map(floor => {
      const floorRooms = rooms.filter(r => r.floor === floor);
      let fCap = 0;
      let fOcc = 0;
      floorRooms.forEach(r => {
        fCap += r.capacity;
        fOcc += r.occupants.length;
      });
      return {
        floor: `Floor ${floor}`,
        percentage: fCap > 0 ? Math.round((fOcc / fCap) * 100) : 0,
        occupied: fOcc,
        available: fCap - fOcc
      };
    });

    res.json({
      totalStudents,
      allocatedStudentsCount,
      occupancyRate: totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0,
      totalCapacity,
      occupiedBeds,
      availableBeds: totalCapacity - occupiedBeds,
      pendingMaintenance,
      lateEntriesToday,
      floorStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
