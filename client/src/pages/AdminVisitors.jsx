import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Search, Filter, Users, Calendar, Clock, CheckCircle, XCircle, Download, Trash2 } from 'lucide-react';
import './AdminVisitors.css';

const AdminVisitors = () => {
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/visitors');
      setRequests(res.data);
    } catch (err) {
      console.error('Error fetching visitor requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    let rejectionReason = '';
    if (status === 'REJECTED') {
      rejectionReason = prompt('Please enter the reason for rejection:');
      if (rejectionReason === null) return; // User cancelled
    }

    try {
      await api.put(`/visitors/${id}/status`, { status, rejectionReason });
      alert(`Pass ${status.toLowerCase()} successfully!`);
      fetchRequests();
    } catch (err) {
      alert('Error updating pass status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this visitor record?')) return;
    try {
      await api.delete(`/visitors/${id}`);
      alert('Record deleted successfully!');
      fetchRequests();
    } catch (err) {
      alert('Error deleting record');
    }
  };

  const generatePassPDF = (req) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 120]
    });

    // Card Background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(5, 5, 90, 110, 3, 3, 'F');

    // Header
    doc.setFontSize(10);
    doc.setTextColor(0, 59, 70); // Teal
    doc.setFont('helvetica', 'bold');
    doc.text(`PASS #HMP-${req._id.substring(req._id.length - 4).toUpperCase()}`, 10, 15);

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(70, 10, 15, 6, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const month = new Date(req.visitDate).toLocaleString('default', { month: 'short' }).toUpperCase();
    const day = new Date(req.visitDate).getDate();
    doc.text(`${month} ${day}`, 72, 14);

    // Visitor Name
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text(req.visitorName, 10, 28);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(`${req.purpose || 'Visitor'} • ${req.relationship}`, 10, 35);

    // Details Grid
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('ARRIVAL', 10, 48);
    doc.text('DEPARTURE', 35, 48);
    doc.text('DATE', 65, 48);

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(formatTime(req.timeIn), 10, 56);
    doc.text(formatTime(req.timeOut), 35, 56);
    doc.text(new Date(req.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2023' }), 65, 56);

    // Separator
    doc.setDrawColor(241, 245, 249);
    doc.line(10, 68, 85, 68);

    // QR Placeholder
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(10, 75, 12, 12, 1, 1, 'F');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('QR', 14, 82);

    doc.setFontSize(12);
    doc.setTextColor(0, 59, 70);
    doc.text('Download Pass', 55, 83);

    doc.save(`Pass_${req.visitorName.replace(/\s+/g, '_')}.pdf`);
  };

  const isExpired = (visitDate, timeOut) => {
    const now = new Date();
    const [h, m] = timeOut.split(':');
    const expTime = new Date(visitDate);
    expTime.setHours(parseInt(h), parseInt(m), 0);
    return now > expTime;
  };

  const stats = [
    { label: 'Active Visitors', value: requests.filter(r => r.status === 'APPROVED' && !isExpired(r.visitDate, r.timeOut)).length, color: '#00A86B' },
    { label: 'Pending Requests', value: requests.filter(r => r.status === 'PENDING').length, color: '#F4A261' },
    { label: 'Total Requests', value: requests.length, color: '#003B46' },
  ];

  const currentlyOnCampus = requests.filter(r =>
    r.status === 'APPROVED' && !isExpired(r.visitDate, r.timeOut)
  );

  return (
    <div className="admin-visitors-container">
      <Sidebar role="admin" />

      <main className="admin-main">
        <header className="admin-header animate-fade-in">
          <div className="header-left">
            <h2>Visitor Management</h2>
            <p>Approve guest access and monitor active visitors on campus.</p>
          </div>
        </header>

        <div className="admin-stats-row animate-fade-in delay-1">
          {stats.map((s, i) => (
            <div key={i} className="v-stat-card card hover-lift">
              <span style={{ color: s.color }}>{s.value}</span>
              <p>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="admin-visitors-table card animate-slide-up delay-2">
          <div className="sec-header">
            <h3>Recent Requests</h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>PASS ID</th>
                <th>STUDENT</th>
                <th>VISITOR NAME</th>
                <th>RELATIONSHIP</th>
                <th>DATE & TIME</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req._id} className="animate-fade-in">
                  <td><strong>#{req._id.substring(req._id.length - 6).toUpperCase()}</strong></td>
                  <td>{req.studentId?.fullName} ({req.studentId?.regNumber})</td>
                  <td>{req.visitorName}</td>
                  <td><span className="v-rel">{req.relationship}</span></td>
                  <td>
                    <div className="v-time">
                      <strong>{new Date(req.visitDate).toLocaleDateString()}</strong>
                      <span>{formatTime(req.timeIn)} - {formatTime(req.timeOut)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`v-status-badge ${req.status.toLowerCase()}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-btns">
                      {req.status === 'PENDING' ? (
                        <>
                          <button
                            className="btn-approve"
                            title="Approve"
                            onClick={() => handleStatusUpdate(req._id, 'APPROVED')}
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            className="btn-reject"
                            title="Reject"
                            onClick={() => handleStatusUpdate(req._id, 'REJECTED')}
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      ) : req.status === 'APPROVED' ? (
                        <>
                          <button className="btn-download" onClick={() => generatePassPDF(req)}>
                            <Download size={18} />
                          </button>
                          <button
                            className="btn-delete"
                            title="Delete Record"
                            onClick={() => handleDelete(req._id)}
                          >
                            <Trash2 size={18} color="#E63946" />
                          </button>
                        </>
                      ) : (
                        <div className="finalized-row">
                          <span className="v-status-final">Finalized</span>
                          <button
                            className="btn-delete"
                            title="Delete Record"
                            onClick={() => handleDelete(req._id)}
                          >
                            <Trash2 size={18} color="#E63946" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan="7">No requests found.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="active-visitors-list card animate-slide-up delay-3">
          <div className="sec-header">
            <h3>Currently on Campus</h3>
            <span className="live-dot">LIVE</span>
          </div>
          <div className="v-live-grid">
            {currentlyOnCampus.map((v, idx) => (
              <div key={v._id} className="v-live-item animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="v-live-info">
                  <strong>{v.visitorName}</strong>
                  <span>Visit Student: {v.studentId?.fullName}</span>
                </div>
                <div className="v-live-timer">
                  <Clock size={14} /> <span>Arrival: {formatTime(v.timeIn)}</span>
                </div>
                <button
                  className="btn-checkout"
                  onClick={() => handleStatusUpdate(v._id, 'EXITED')}
                >
                  Manual Exit
                </button>
              </div>
            ))}
            {currentlyOnCampus.length === 0 && <p className="no-live">No active visitors on campus.</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminVisitors;
