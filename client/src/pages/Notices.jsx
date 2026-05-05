import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Bell, Info, ShieldAlert, Coffee, BookOpen, Calendar, Clock, CheckCircle } from 'lucide-react';
import './Notices.css';

const Notices = () => {
  const [filter, setFilter] = useState('All');
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get('/comm/notices');
        setNotices(res.data);
      } catch (err) {
        console.error('Error fetching notices:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const filteredNotices = filter === 'All' ? notices : notices.filter(n => n.category === filter);

  return (
    <div className="notices-container">
      <Sidebar role="student" />
      
      <main className="notices-main">
        <header className="notices-header animate-fade-in">
          <div className="header-left">
            <h2>Notice Board</h2>
            <p>Stay updated with the latest announcements, hostel news, and policy changes.</p>
          </div>
          <div className="notices-filters">
            <div className="btn-group">
              <button className={filter === 'All' ? 'active' : ''} onClick={() => setFilter('All')}>All</button>
              <button className={filter === 'URGENT' ? 'active' : ''} onClick={() => setFilter('URGENT')}>Urgent</button>
              <button className={filter === 'GENERAL' ? 'active' : ''} onClick={() => setFilter('GENERAL')}>General</button>
            </div>
            <button className="btn-date"><Calendar size={16} /> This Month</button>
          </div>
        </header>

        <div className="notices-grid animate-slide-up">
          {/* Urgent Featured Notice */}
          {filter === 'All' && notices.length > 0 && (
            <div className="notice-featured card">
              <div className="f-icon-box">
                <ShieldAlert size={32} color="#E63946" />
              </div>
              <div className="f-content">
                <span className="n-tag urgent">URGENT MAINTENANCE</span>
                <h3>{notices[0]?.title}</h3>
                <p>{notices[0]?.content}</p>
                
                <div className="f-footer">
                  <div className="f-meta">
                    <Calendar size={14} /> <span>{new Date(notices[0]?.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="verified-badge">
                    <CheckCircle size={14} /> <span>{notices[0]?.senderName || 'Hostel Admin'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Notices */}
          <div className="regular-notices">
            {filteredNotices.map(notice => (
              <div key={notice._id} className="notice-card card">
                <div className="n-card-header">
                  <span className={`n-badge ${notice.category.toLowerCase()}`}>{notice.category}</span>
                  <span className="n-date">{new Date(notice.createdAt).toLocaleDateString()}</span>
                </div>
                <h4>{notice.title}</h4>
                <p>{notice.content}</p>
                <div className="n-sender">
                  <img src={`https://ui-avatars.com/api/?name=${notice.senderName || 'Admin'}&background=003B46&color=fff`} alt="" />
                  <span>{notice.senderName || 'Hostel Admin'}</span>
                </div>
              </div>
            ))}
            {filteredNotices.length === 0 && <p>No notices found.</p>}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notices;
