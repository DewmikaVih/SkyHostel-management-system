import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Search, Filter, Edit, Users, Mail, Phone, User, GraduationCap, PhoneCall, X } from 'lucide-react';
import './AdminRooms.css';

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [roomStats, setRoomStats] = useState({ total: 0, available: 0, occupied: 0, cleaning: 0, restricted: 0 });
  const [loading, setLoading] = useState(true);
  const [filterFloor, setFilterFloor] = useState('All Floors');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Profile Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const floorQuery = filterFloor !== 'All Floors' ? `?floor=${filterFloor}` : '';
      const res = await api.get(`/rooms${floorQuery}`);
      setRooms(res.data.rooms || []); 
      if (res.data.stats) setRoomStats(res.data.stats);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filterFloor]);

  const handleStatusUpdate = async (roomId, newStatus) => {
    try {
      await api.put(`/rooms/${roomId}/status`, { status: newStatus });
      fetchRooms();
    } catch (err) {
      alert('Error updating room status');
    }
  };

  const handleUnassign = async (roomId, studentId) => {
    if (!window.confirm('Are you sure you want to unassign this student?')) return;
    try {
      await api.post('/rooms/unassign', { roomId, studentId });
      fetchRooms(); // Refresh table
    } catch (err) {
      alert('Error unassigning student');
    }
  };

  const fetchStudentProfile = async (studentId) => {
    setProfileLoading(true);
    setShowProfileModal(true);
    try {
      const res = await api.get(`/auth/user/${studentId}`);
      setSelectedStudent(res.data);
    } catch (err) {
      console.error('Error fetching student profile:', err);
      alert('Could not load student profile');
      setShowProfileModal(false);
    } finally {
      setProfileLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room => 
    room.roomNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-rooms-container">
      <Sidebar role="admin" />
      
      <main className="admin-main">
        <header className="admin-header animate-fade-in">
          <div className="header-left">
            <h2>Room Management</h2>
            <p>Master control for all hostel accommodations</p>
          </div>
          <button className="btn-primary-admin">+ Add New Room</button>
        </header>

        {/* Room Status Summary Bar */}
        <div className="room-summary-bar card animate-fade-in delay-1">
          <div className="sum-item">
            <span className="sum-label">Total Rooms</span>
            <span className="sum-value">{roomStats.total}</span>
          </div>
          <div className="sum-item available">
            <span className="sum-label">Available</span>
            <span className="sum-value">{roomStats.available}</span>
          </div>
          <div className="sum-item occupied">
            <span className="sum-label">Occupied</span>
            <span className="sum-value">{roomStats.occupied}</span>
          </div>
          <div className="sum-item cleaning">
            <span className="sum-label">Cleaning</span>
            <span className="sum-value">{roomStats.cleaning}</span>
          </div>
          <div className="sum-item restricted">
            <span className="sum-label">Restricted</span>
            <span className="sum-value">{roomStats.restricted}</span>
          </div>
        </div>

        <div className="admin-filters-bar card animate-slide-up delay-2">
          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by Room No..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select value={filterFloor} onChange={(e) => setFilterFloor(e.target.value)}>
              <option>All Floors</option>
              <option value="01">Floor 01</option>
              <option value="02">Floor 02</option>
              <option value="03">Floor 03</option>
            </select>
            <button className="btn-filter"><Filter size={16} /> Filters</button>
          </div>
        </div>

        <div className="admin-rooms-table-container card animate-slide-up delay-3">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ROOM NO</th>
                <th>FLOOR</th>
                <th>TYPE</th>
                <th>OCCUPANCY</th>
                <th>STUDENTS ASSIGNED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map(room => (
                <tr key={room._id}>
                  <td><strong>{room.roomNumber}</strong></td>
                  <td>Floor {room.floor}</td>
                  <td>{room.type}</td>
                  <td>
                    <div className="occ-flex">
                      <Users size={14} /> {room.occupants.length} / {room.capacity}
                    </div>
                  </td>
                  <td>
                    <div className="student-tags">
                      {room.occupants.map((occ, idx) => (
                        <span key={idx} className="student-tag">
                          <span 
                            className="clickable-name" 
                            onClick={() => fetchStudentProfile(occ._id || occ)}
                          >
                            {occ.fullName || "Loading..."}
                          </span>
                          <button 
                            className="btn-unassign" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnassign(room._id, occ._id || occ);
                            }}
                            title="Unassign Student"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {room.occupants.length === 0 && <span className="none">None</span>}
                    </div>
                  </td>
                  <td>
                    <select 
                      className={`status-select ${room.status.toLowerCase()}`}
                      value={room.status}
                      onChange={(e) => handleStatusUpdate(room._id, e.target.value)}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="OCCUPIED">Occupied</option>
                      <option value="CLEANING">Cleaning</option>
                      <option value="RESTRICTED">Restricted</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            <span>Showing {filteredRooms.length} rooms</span>
          </div>
        </div>

        {/* Student Profile Modal */}
        {showProfileModal && (
          <div className="admin-modal-overlay" onClick={() => setShowProfileModal(false)}>
            <div className="admin-profile-modal card" onClick={e => e.stopPropagation()}>
              <div className="a-modal-header">
                <h3>Student Profile Detail</h3>
                <button className="a-close" onClick={() => setShowProfileModal(false)}><X size={20} /></button>
              </div>
              
              {profileLoading ? (
                <div className="modal-loading">Loading student data...</div>
              ) : selectedStudent && (
                <div className="a-modal-content">
                  <div className="a-profile-summary">
                    <img 
                      src={selectedStudent.profilePicture || `https://ui-avatars.com/api/?name=${selectedStudent.fullName}&background=FBD38D&color=744210`} 
                      alt="Profile" 
                      className="a-p-img"
                    />
                    <div className="a-p-info">
                      <span className="a-status-badge">ACTIVE RESIDENT</span>
                      <h4>{selectedStudent.fullName}</h4>
                      <p className="a-reg">Reg: {selectedStudent.regNumber}</p>
                      <div className="a-p-pills">
                        <span><Mail size={12} /> {selectedStudent.email}</span>
                        <span><Phone size={12} /> {selectedStudent.phoneNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="a-details-grid">
                    <div className="a-detail-section">
                      <div className="a-section-title"><User size={16} /> Personal Details</div>
                      <div className="a-item"><span>DOB:</span> <p>{selectedStudent.dob || 'Not Set'}</p></div>
                      <div className="a-item"><span>Gender:</span> <p>{selectedStudent.gender || 'Not Set'}</p></div>
                      <div className="a-item"><span>NIC:</span> <p>{selectedStudent.nic || 'Not Set'}</p></div>
                      <div className="a-item"><span>Address:</span> <p>{selectedStudent.homeAddress || 'Not Set'}</p></div>
                    </div>

                    <div className="a-detail-section">
                      <div className="a-section-title"><GraduationCap size={16} /> Academic Info</div>
                      <div className="a-item"><span>Faculty:</span> <p>{selectedStudent.faculty || 'Not Set'}</p></div>
                      <div className="a-item"><span>Year:</span> <p>{selectedStudent.academicYear || 'Not Set'}</p></div>
                    </div>

                    <div className="a-detail-section emergency">
                      <div className="a-section-title"><PhoneCall size={16} /> Emergency Contact</div>
                      <div className="a-e-box">
                        <h5>{selectedStudent.emergencyContact?.name || 'N/A'}</h5>
                        <span>Rel: {selectedStudent.emergencyContact?.relationship || '-'}</span>
                        <div className="a-e-contact">
                          <div><Phone size={12} /> {selectedStudent.emergencyContact?.phone || '-'}</div>
                          <div><Mail size={12} /> {selectedStudent.emergencyContact?.email || '-'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminRooms;
