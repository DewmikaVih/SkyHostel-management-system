import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Clock, CheckSquare, Wrench, Users, Search, Filter, AlertCircle, Star, Trash2 } from 'lucide-react';
import './AdminMaintenance.css';

const AdminMaintenance = () => {
  const [tickets, setTickets] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tickRes, feedRes] = await Promise.all([
          api.get('/maintenance'),
          api.get('/feedback')
        ]);
        setTickets(tickRes.data);
        setFeedbacks(feedRes.data);
      } catch (err) {
        console.error('Error fetching admin maintenance data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/maintenance/${id}`, { status });
      setTickets(tickets.map(t => t._id === id ? { ...t, status } : t));
      alert('Status updated!');
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Are you sure you want to remove this resolved record?')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      setTickets(tickets.filter(t => t._id !== id));
      alert('Record removed!');
    } catch (err) {
      alert('Error removing record');
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'HIGH': return 'p-high';
      case 'MEDIUM': return 'p-medium';
      case 'LOW': return 'p-low';
      default: return '';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RESOLVED': return <span className="m-badge res">RESOLVED</span>;
      case 'IN_PROGRESS': return <span className="m-badge prog">IN PROGRESS</span>;
      case 'ASSIGNED': return <span className="m-badge asgn">ASSIGNED</span>;
      default: return <span className="m-badge pend">PENDING</span>;
    }
  };

  return (
    <div className="admin-maintenance-container">
      <Sidebar role="admin" />

      <main className="admin-main">
        <header className="admin-header animate-fade-in">
          <div className="header-left">
            <h2>Maintenance Management</h2>
            <p>Manage hostel facility issues and resident feedback.</p>
          </div>
        </header>

        <div className="admin-stats-bar animate-fade-in delay-1">
          <div className="m-stat-card card hover-lift">
            <Clock size={20} color="#E63946" />
            <div>
              <h3>{tickets.filter(t => t.status === 'PENDING').length}</h3>
              <p>Pending Requests</p>
            </div>
          </div>
          <div className="m-stat-card card hover-lift">
            <Clock size={20} color="#F4A261" />
            <div>
              <h3>{tickets.filter(t => t.status === 'IN_PROGRESS').length}</h3>
              <p>In Progress</p>
            </div>
          </div>
          <div className="m-stat-card card hover-lift">
            <CheckSquare size={20} color="#00A86B" />
            <div>
              <h3>{tickets.filter(t => t.status === 'RESOLVED').length}</h3>
              <p>Total Resolved</p>
            </div>
          </div>
          <div className="m-stat-card card hover-lift">
            <Users size={20} color="#003B46" />
            <div>
              <h3>{feedbacks.length}</h3>
              <p>Total Feedbacks</p>
            </div>
          </div>
        </div>

        <div className="admin-tickets-container card animate-slide-up delay-2">
          <div className="sec-header">
            <h3>Recent Maintenance Requests</h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>TICKET ID</th>
                <th>STUDENT & ROOM</th>
                <th>ISSUE TITLE</th>
                <th>DESCRIPTION</th>
                <th>STATUS</th>
                <th>REPORTED</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t._id} className="animate-fade-in">
                  <td><strong>#{t._id.substring(t._id.length - 6).toUpperCase()}</strong></td>
                  <td>
                    <div className="t-user-info">
                      <strong>{t.studentId?.fullName}</strong>
                      <span>Room {t.roomId?.roomNumber}</span>
                    </div>
                  </td>
                  <td>
                    <div className="t-issue">
                      <strong>{t.category}</strong>
                      <p className="t-title">{t.title}</p>
                    </div>
                  </td>
                  <td>
                    <div className="t-desc-col">
                      <p className="t-desc">{t.description}</p>
                      {t.imageUrl && (
                        <a href={t.imageUrl} target="_blank" rel="noreferrer" className="img-link">View Attachment</a>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      <select
                        className={`status-select ${t.status.toLowerCase()}`}
                        value={t.status}
                        onChange={(e) => handleStatusUpdate(t._id, e.target.value)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                      {t.status === 'RESOLVED' && (
                        <button
                          className="btn-delete-ticket"
                          onClick={() => handleDeleteTicket(t._id)}
                          title="Remove resolved record"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="t-date">{new Date(t.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-feedback-section card animate-slide-up delay-3">
          <div className="sec-header">
            <h3>Resident Feedback</h3>
          </div>
          <div className="admin-feedback-grid">
            {feedbacks.map(f => (
              <div key={f._id} className="admin-f-card">
                <div className="f-header-admin">
                  <img
                    src={f.studentId?.profilePicture || `https://ui-avatars.com/api/?name=${f.fullName}&background=random`}
                    alt={f.fullName}
                    className="admin-f-avatar"
                  />
                  <div className="f-info">
                    <strong>{f.fullName}</strong>
                    <div className="f-stars">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < f.rating ? "#FBBF24" : "none"} color={i < f.rating ? "#FBBF24" : "#CBD5E0"} />
                      ))}
                    </div>
                  </div>
                </div>
                <p>"{f.comment}"</p>
                <span>{new Date(f.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMaintenance;
