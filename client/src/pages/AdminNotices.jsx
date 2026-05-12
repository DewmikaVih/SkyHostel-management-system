import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Bell, Trash2, Edit, CheckCircle, Clock, Send, Pin } from 'lucide-react';
import './AdminNotices.css';

const AdminNotices = () => {
  const [notices, setNotices] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    targetYear: 'All',
    targetFaculty: 'All',
    isPinned: false,
    sendEmail: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await api.get('/notices');
      setNotices(res.data);
    } catch (err) {
      console.error('Error fetching notices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notices', formData);
      alert('Announcement broadcast successfully!');
      setFormData({
        title: '',
        content: '',
        category: 'GENERAL',
        targetYear: 'All',
        targetFaculty: 'All',
        isPinned: false,
        sendEmail: false
      });
      fetchNotices();
    } catch (err) {
      alert('Error broadcasting notice');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      fetchNotices();
    } catch (err) {
      alert('Error deleting notice');
    }
  };

  return (
    <div className="admin-notices-container">
      <Sidebar role="admin" />
      
      <main className="admin-main">
        <header className="admin-header animate-fade-in">
          <div className="header-left">
            <h2>Notice Board Management</h2>
            <p>Broadcast announcements and manage digital notices for residents.</p>
          </div>
        </header>

        <div className="notices-admin-content animate-slide-up">
          <div className="compose-notice-card card">
            <div className="sec-header">
              <h3>Create New Announcement</h3>
            </div>
            <form className="admin-n-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Notice Title</label>
                <input 
                  type="text" 
                  name="title"
                  placeholder="e.g. Annual Sports Meet 2024" 
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="n-row">
                <div className="input-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="GENERAL">General</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CANTEEN">Canteen</option>
                    <option value="POLICY">Policy</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Target Year</label>
                  <select name="targetYear" value={formData.targetYear} onChange={handleInputChange}>
                    <option value="All">All Years</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Target Faculty</label>
                  <select name="targetFaculty" value={formData.targetFaculty} onChange={handleInputChange}>
                    <option value="All">All Faculties</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Computing">Computing</option>
                    <option value="Business">Business</option>
                    <option value="Science">Science</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Content</label>
                <textarea 
                  name="content"
                  placeholder="Write the details of the announcement here..."
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              <div className="n-actions">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="isPinned"
                    checked={formData.isPinned}
                    onChange={handleInputChange}
                  /> Pin to top
                </label>
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    name="sendEmail"
                    checked={formData.sendEmail}
                    onChange={handleInputChange}
                  /> Send SMS Alert (Email)
                </label>
                <button type="submit" className="btn-broadcast">
                  <Send size={18} /> Broadcast Now
                </button>
              </div>
            </form>
          </div>

          <div className="manage-notices-section">
            <div className="sec-header">
              <h3>Active & Recent Notices</h3>
            </div>
            <div className="admin-n-list">
              {notices.map((n, idx) => (
                <div key={n._id} className={`admin-n-item card ${n.isPinned ? 'pinned-notice' : ''} hover-lift animate-fade-in`} style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="n-item-header">
                    <div className="n-tags">
                      <span className={`n-tag-admin ${n.category.toLowerCase()}`}>{n.category}</span>
                      {n.isPinned && <span className="pinned-tag"><Pin size={12} /> Pinned</span>}
                    </div>
                    <div className="n-item-actions">
                      <button className="btn-n-icon delete" onClick={() => handleDelete(n._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h4>{n.title}</h4>
                  <p className="n-excerpt">{n.content.substring(0, 100)}...</p>
                  <div className="n-item-meta">
                    <div className="m-block">
                      <Clock size={12} /> <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="m-block">
                      <CheckCircle size={12} /> <span>{n.authorId?.fullName || 'Admin'}</span>
                    </div>
                    <div className="target-info">
                      Target: {n.targetFaculty}, {n.targetYear}
                    </div>
                  </div>
                </div>
              ))}
              {notices.length === 0 && <p className="no-notices">No announcements yet.</p>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminNotices;
