import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Bed, Users, Wifi, Wind, ShieldCheck, ChevronRight } from 'lucide-react';
import './AllocationHub.css';

const AllocationHub = () => {
  const { user, updateUser, loading: authLoading } = useContext(AuthContext);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [floor, setFloor] = useState('01');
  const [rooms, setRooms] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, occupied: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const syncUser = async () => {
      try {
        const meRes = await api.get('/auth/me');
        updateUser(meRes.data);
      } catch (err) {
        console.error('Error syncing user:', err);
      }
    };
    syncUser();
  }, [authLoading]);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/rooms?floor=${floor}`);

        if (res.data && res.data.rooms) {
          setRooms(res.data.rooms);
          setStats(res.data.stats || {
            total: res.data.rooms.length,
            available: res.data.rooms.filter(r => r.status === 'AVAILABLE').length,
            occupied: res.data.rooms.filter(r => r.status === 'OCCUPIED').length,
            maintenance: res.data.rooms.filter(r => r.status === 'CLEANING' || r.status === 'RESTRICTED').length
          });
        } else {
          // Fallback for array response
          const roomsArr = Array.isArray(res.data) ? res.data : [];
          setRooms(roomsArr);
          setStats({
            total: roomsArr.length,
            available: roomsArr.filter(r => r.status === 'AVAILABLE').length,
            occupied: roomsArr.filter(r => r.status === 'OCCUPIED').length,
            maintenance: roomsArr.filter(r => r.status === 'CLEANING' || r.status === 'RESTRICTED').length
          });
        }
      } catch (err) {
        console.error('Error fetching rooms:', err);
        alert('Could not load rooms. Please check if the database is seeded.');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [floor]);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
  };

  const handleAllocateDirect = async (roomId) => {
    try {
      await api.post('/rooms/allocate', { roomId });
      updateUser({ assignedRoomId: roomId });
      alert('Room allocated successfully!');
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.response?.data?.message || 'Error allocating room');
    }
  };

  const handleAllocate = async () => {
    if (!selectedRoom) return;
    try {
      await api.post('/rooms/allocate', { roomId: selectedRoom._id });
      updateUser({ assignedRoomId: selectedRoom._id });
      alert('Room allocated successfully!');
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err.response?.data?.message || 'Error allocating room');
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'AVAILABLE': return 's-available';
      case 'OCCUPIED': return 's-occupied';
      case 'CLEANING': return 's-cleaning';
      case 'RESTRICTED': return 's-restricted';
      default: return '';
    }
  };

  return (
    <div className="allocation-container">
      <Sidebar role="student" />

      <main className="allocation-main">
        <header className="allocation-header animate-fade-in">
          <div className="header-left">
            <h2>Room Allocation Management</h2>
            <p>Explore available housing options and secure your preferred room for the upcoming semester.</p>
          </div>
          <div className="floor-tabs">
            {['01', '02', '03'].map(f => (
              <button
                key={f}
                className={floor === f ? 'active' : ''}
                onClick={() => setFloor(f)}
              >
                Floor {f}
              </button>
            ))}
          </div>
        </header>

        <div className="allocation-content animate-slide-up">
          <div className="map-section">
            <div className="legend">
              <div className="l-item"><div className="dot green"></div> Available</div>
              <div className="l-item"><div className="dot red"></div> Occupied</div>
              <div className="l-item"><div className="dot orange"></div> Cleaning</div>
              <div className="l-item"><div className="dot gray"></div> Restricted</div>
            </div>

            <div className="room-grid">
              {rooms.map(room => {
                const isMyRoom = user?.assignedRoomId === room._id;
                return (
                  <div
                    key={room._id}
                    className={`room-card ${getStatusClass(room.status)} ${selectedRoom?._id === room._id ? 'selected' : ''} ${isMyRoom ? 'my-room' : ''}`}
                    onClick={() => handleRoomClick(room)}
                  >
                    {isMyRoom && <div className="my-room-badge">MY ROOM</div>}
                    <div className="room-info">
                      <span className="room-type">{room.type}</span>
                      <span className="room-num">{room.roomNumber}</span>
                    </div>
                    <div className="occupancy-icons">
                      {[...Array(room.capacity)].map((_, i) => (
                        <Users key={i} size={12} className={i < room.occupants.length ? 'occ' : ''} />
                      ))}
                    </div>
                    {room.status === 'RESTRICTED' && <ShieldCheck size={16} className="lock-icon" />}
                    {room.status === 'CLEANING' && <div className="cleaning-icon">🧹</div>}
                  </div>
                );
              })}
            </div>

            <div className="map-stats">
              <div className="stat"><span>TOTAL ROOMS</span> <h3>{stats.total}</h3></div>
              <div className="stat"><span>AVAILABLE</span> <h3 className="green-text">{stats.available}</h3></div>
              <div className="stat"><span>OCCUPIED</span> <h3 className="red-text">{stats.occupied}</h3></div>
              <div className="stat"><span>MAINTENANCE</span> <h3 className="orange-text">{stats.maintenance}</h3></div>
            </div>
          </div>

          <aside className="details-section">
            {selectedRoom ? (
              <div className="room-detail-card card">
                <div className="d-header">
                  <div className="d-title">
                    <h3>Room {selectedRoom.roomNumber}</h3>
                    <div className="d-status">
                      <div className="dot-green"></div>
                      <span>CURRENTLY {selectedRoom.status}</span>
                    </div>
                  </div>
                  <Bed size={24} className="d-icon" />
                </div>

                <div className="d-info">
                  <div className="info-row">
                    <span>Room Type</span>
                    <strong>{selectedRoom.type} Shared</strong>
                  </div>
                  <div className="info-row amenities-row">
                    <span>Amenities</span>
                    <div className="a-icons">
                      <Wind size={18} title="AC" />
                      <Wifi size={18} title="WiFi" />
                      <ShieldCheck size={18} title="Locker" />
                    </div>
                  </div>
                </div>

                <div className="notice-box">
                  <h5>Self-Allocation Notice:</h5>
                  <p>You are about to allocate Room {selectedRoom.roomNumber} to your profile. This action will be confirmed once initial deposit is verified.</p>
                </div>

                <button
                  className="btn-confirm"
                  onClick={handleAllocate}
                  disabled={selectedRoom.status !== 'AVAILABLE' || user?.assignedRoomId}
                >
                  Confirm Allocation
                </button>
                <button className="btn-tour">View Virtual Tour</button>
              </div>
            ) : (
              <div className="no-selection card">
                <Bed size={48} color="#CBD5E0" />
                <p>Select a room from the map to view details and proceed with allocation.</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AllocationHub;
