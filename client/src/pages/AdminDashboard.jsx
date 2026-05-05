import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Users, Bed, Wrench, ShieldAlert, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, LogIn, LogOut, Search, AlertTriangle, User } from 'lucide-react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [data, setData] = useState({
    stats: [
      { title: 'Total Students', value: '0', change: '0%', type: 'up', icon: <Users size={20} /> },
      { title: 'Total Room Allocated', value: '0', change: '0%', type: 'up', icon: <Users size={20} /> },
      { title: 'Room Occupancy', value: '0%', change: '0%', type: 'up', icon: <Bed size={20} /> },
      { title: 'Pending Maintenance', value: '0', change: '0%', type: 'down', icon: <Wrench size={20} /> },
      { title: 'Late Entries Today', value: '0', change: '0%', type: 'up', icon: <ShieldAlert size={20} /> },
    ],
    floorStats: [],
    totals: { available: 0, occupied: 0 }
  });

  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [violators, setViolators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [socketStatus, setSocketStatus] = useState('connecting');

  const fetchStats = async () => {
    try {
      const res = await api.get('/rooms/admin/stats');
      const d = res.data;
      setData({
        stats: [
          { title: 'Total Students', value: d.totalStudents.toLocaleString(), change: '+2%', type: 'up', icon: <Users size={20} /> },
          { title: 'Total Room Allocated', value: d.allocatedStudentsCount.toLocaleString(), change: '+5%', type: 'up', icon: <Users size={20} /> },
          { title: 'Room Occupancy', value: `${d.occupancyRate}%`, change: '+3%', type: 'up', icon: <Bed size={20} /> },
          { title: 'Pending Maintenance', value: d.pendingMaintenance.toString(), change: '-1%', type: 'down', icon: <Wrench size={20} /> },
          { title: 'Late Entries Today', value: d.lateEntriesToday.toString().padStart(2, '0'), change: '+2', type: 'up', icon: <ShieldAlert size={20} /> },
        ],
        floorStats: d.floorStats,
        totals: { available: d.availableBeds, occupied: d.occupiedBeds }
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const [histRes, violRes] = await Promise.all([
        api.get('/visitors/attendance/history'),
        api.get('/visitors/attendance/violators')
      ]);
      setAttendanceEvents(histRes.data);
      setViolators(violRes.data);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAttendanceHistory();

    // Socket Setup
    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketStatus('online');
    });

    socket.on('attendance_alert', (event) => {
      setAttendanceEvents(prev => [{ id: Date.now(), ...event }, ...prev].slice(0, 25));
    });

    socket.on('curfew_violation', (event) => {
      setAttendanceEvents(prev => [{
        id: Date.now(),
        studentName: event.studentName,
        regNumber: event.regNumber,
        type: 'VIOLATION',
        time: event.time,
        note: `Late Entry #${event.entries}`
      }, ...prev].slice(0, 25));

      if (event.entries >= 7) {
        fetchAttendanceHistory(); // Refresh violators list
      }
    });

    return () => socket.disconnect();
  }, []);

  const filteredEvents = attendanceEvents.filter(event =>
    event.regNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-dashboard-container">
      <Sidebar role="admin" />

      <main className="admin-main">
        <header className="admin-header animate-fade-in">
          <div className="header-left">
            <h2>Admin Dashboard</h2>
            <p>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="admin-profile" onClick={() => navigate('/admin/profile')} style={{ cursor: 'pointer' }}>
            <div className="admin-info">
              <strong>{user?.fullName || 'Admin Warden'}</strong>
              <span>{user?.staffId || 'Chief Warden'}</span>
            </div>
            <img src={user?.profilePicture || `https://ui-avatars.com/api/?name=${user?.fullName || 'Admin'}&background=003B46&color=fff`} alt="Admin" />
          </div>
        </header>

        <div className="admin-stats-grid">
          {data.stats.map((stat, i) => (
            <div key={i} className={`stat-card card animate-slide-up delay-${(i % 4) + 1} hover-lift`}>
              <div className="stat-header">
                <div className="stat-icon">{stat.icon}</div>
                <span className={`stat-change ${stat.type}`}>{stat.change}</span>
              </div>
              <div className="stat-body">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="admin-content-row animate-slide-up delay-2">
          {/* Occupancy Section */}
          <div className="occupancy-chart-section card full-width hover-lift">
            <div className="sec-header">
              <h3>Occupancy Analytics</h3>
            </div>
            <div className="chart-placeholder">
              {data.floorStats.map((fs, i) => (
                <div key={i} className="chart-bar-group">
                  <div className="bar-label">{fs.floor}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${fs.percentage}%` }}></div></div>
                  <div className="bar-value">{fs.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-tracker-section card animate-slide-up delay-3">
          <div className="sec-header">
            <h3>In/Out Real-time Tracker</h3>
            <div className="tracker-actions">
              <div className="search-box">
                <Search size={18} className="search-icon-inline" />
                <input
                  type="text"
                  placeholder="Search Registration No or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={`live-badge ${socketStatus}`}>
                <div className="status-dot"></div>
                {socketStatus === 'online' ? 'LIVE FEED' : 'RECONNECTING...'}
              </div>
            </div>
          </div>

          <div className="tracker-table-container scrollable">
            <table className="tracker-table">
              <thead>
                <tr>
                  <th>Reg Number</th>
                  <th>Student Name</th>
                  <th>Action</th>
                  <th>Timestamp</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length > 0 ? filteredEvents.map(event => (
                  <tr key={event.id || event._id} className={event.type === 'VIOLATION' ? 'row-warning animate-fade-in' : 'animate-fade-in'}>
                    <td className="reg-col">{event.regNumber || 'N/A'}</td>
                    <td className="name-col">{event.studentName}</td>
                    <td>
                      <span className={`status-tag ${event.type}`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="time-col">{new Date(event.time).toLocaleTimeString()}</td>
                    <td className={`note-col ${event.note?.includes('Late Entry') ? 'late-note' : ''}`}>
                      {event.note || '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="empty-row">Waiting for live updates...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-content-row animate-slide-up delay-4" style={{ marginTop: '24px' }}>
          {/* Curfew Violators Section */}
          <div className="violators-section card full-width hover-lift">
            <div className="sec-header">
              <div className="title-with-icon">
                <AlertTriangle size={20} color="#E63946" />
                <h3>Curfew Violators (7+ Late Entries This Month)</h3>
              </div>
              <span className="v-badge">{violators.length} Total</span>
            </div>
            <div className="violators-list-grid">
              {violators.length > 0 ? violators.map((v, idx) => (
                <div key={v._id} className="violator-item animate-fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="vi-info">
                    <div className="vi-avatar">
                      <User size={18} />
                    </div>
                    <div>
                      <strong>{v.fullName}</strong>
                      <span>{v.regNumber}</span>
                    </div>
                  </div>
                  <div className="vi-stat">
                    <span className="vi-count">{v.monthlyLateEntries} Late Returns</span>
                    <span className="vi-fine">Automatic Fine: LKR 250 Issued</span>
                  </div>
                </div>
              )) : (
                <div className="empty-violators">
                  <ShieldAlert size={48} color="#E2E8F0" />
                  <p>No severe violations recorded for this billing cycle.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
