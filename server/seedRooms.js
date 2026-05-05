const mongoose = require('mongoose');
const Room = require('./models/Room');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel_db';

const seedRooms = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing rooms
    await Room.deleteMany({});
    console.log('Cleared existing rooms.');

    // Clear user room assignments to prevent broken links
    const User = require('./models/User');
    await User.updateMany({}, { $set: { assignedRoomId: null } });
    console.log('Cleared all user room assignments.');

    const floors = ['01', '02', '03'];
    const roomsToInsert = [];

    floors.forEach(floor => {
      // 20 rooms per floor
      // 1-4: QUAD (Capacity 4)
      // 5-20: DOUBLE (Capacity 2)
      for (let i = 1; i <= 20; i++) {
        const roomNum = `${floor}${i.toString().padStart(2, '0')}`;
        const isQuad = i <= 4;
        
        let status = 'AVAILABLE';
        if (i === 5 || i === 12) status = 'OCCUPIED';
        if (i === 8) status = 'CLEANING';
        if (i === 15) status = 'RESTRICTED';

        roomsToInsert.push({
          roomNumber: roomNum,
          floor: floor,
          wing: 'Main Wing',
          type: isQuad ? 'QUAD' : 'DOUBLE',
          capacity: isQuad ? 4 : 2,
          status: status,
          occupants: [],
          amenities: ['WIFI', 'LOCKER', i % 2 === 0 ? 'AC' : 'FAN']
        });
      }
    });

    await Room.insertMany(roomsToInsert);
    console.log(`Successfully seeded ${roomsToInsert.length} rooms.`);
    
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedRooms();
