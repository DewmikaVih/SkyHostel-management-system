const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hostel_db')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('Database Connection Error:', err));

// Socket.io for Real-time Notifications
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Pass io to routes
app.set('socketio', io);

// Routes
app.get('/', (req, res) => {
  res.send('Hostel Management System API is running...');
});

// Import Routes (To be created)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const roomRoutes = require('./routes/room');
app.use('/api/rooms', roomRoutes);

const maintenanceRoutes = require('./routes/maintenance');
app.use('/api/maintenance', maintenanceRoutes);

const visitorRoutes = require('./routes/visitor');
app.use('/api/visitors', visitorRoutes);

const communicationRoutes = require('./routes/communication');
app.use('/api/comm', communicationRoutes);

const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', feedbackRoutes);

const canteenRoutes = require('./routes/canteen');
app.use('/api/canteen', canteenRoutes);

const noticeRoutes = require('./routes/notice');
app.use('/api/notices', noticeRoutes);

app.use('/api/fines', require('./routes/fine'));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
