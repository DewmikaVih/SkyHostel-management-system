const Maintenance = require('../models/Maintenance');
const Room = require('../models/Room');

// @desc    Create maintenance ticket
// @route   POST /api/maintenance
exports.createTicket = async (req, res) => {
  const { title, category, description, imageUrl, roomId } = req.body;
  const studentId = req.user.id;

  try {
    if (!roomId || roomId === 'Not Allocated') {
      return res.status(400).json({ message: 'Please allocate a room before reporting an issue.' });
    }

    const ticket = await Maintenance.create({
      studentId,
      roomId,
      title,
      category: category.toUpperCase(),
      description,
      imageUrl
    });

    // Update Room status to CLEANING/MAINTENANCE automatically
    await Room.findByIdAndUpdate(roomId, { status: 'CLEANING' });

    // Notify admins via socket (optional logic)
    const io = req.app.get('socketio');
    io.emit('new_maintenance_ticket', ticket);

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's own tickets
// @route   GET /api/maintenance/my-tickets
exports.getMyTickets = async (req, res) => {
  try {
    const tickets = await Maintenance.find({ studentId: req.user.id }).sort('-createdAt');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tickets (Admin only)
// @route   GET /api/maintenance
exports.getAllTickets = async (req, res) => {
  try {
    const { status, priority } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await Maintenance.find(query)
      .populate('studentId', 'fullName')
      .populate('roomId', 'roomNumber')
      .sort('-createdAt');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ticket status/priority (Admin only)
// @route   PUT /api/maintenance/:id
exports.updateTicket = async (req, res) => {
  const { status, priority, adminFeedback } = req.body;
  try {
    const ticket = await Maintenance.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (adminFeedback) ticket.adminFeedback = adminFeedback;

    await ticket.save();

    // Notify student via socket
    const io = req.app.get('socketio');
    io.to(ticket.studentId.toString()).emit('ticket_updated', ticket);

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit feedback/rating (Student only)
// @route   PUT /api/maintenance/:id/feedback
exports.submitFeedback = async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const ticket = await Maintenance.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.studentId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    ticket.studentRating = rating;
    ticket.studentComment = comment;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a ticket (Admin only)
// @route   DELETE /api/maintenance/:id
exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Maintenance.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    await ticket.deleteOne();
    res.json({ message: 'Maintenance record removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
