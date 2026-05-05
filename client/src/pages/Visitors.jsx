import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { PlusCircle, Info, Download, QrCode, Clock, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import './Visitors.css';

const Visitors = () => {
  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    relationship: 'Parent',
    purpose: '',
    visitDate: '',
    timeIn: '',
    timeOut: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    try {
      const res = await api.get('/visitors/my-passes');
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching passes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visitors', formData);
      alert('Visitor pass request submitted!');
      setFormData({
        visitorName: '',
        visitorPhone: '',
        relationship: 'Parent',
        purpose: '',
        visitDate: '',
        timeIn: '',
        timeOut: ''
      });
      fetchPasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting request');
    }
  };

  const downloadPass = (pass) => {
    // We'll use a specialized print view for the pass
    const printContent = document.getElementById(`pass-${pass._id}`).innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; max-width: 400px; border: 2px solid #003B46; border-radius: 12px; margin: auto;">
        ${printContent}
      </div>
    `;
    window.print();
    window.location.reload(); // Restore original UI
  };

  const activePasses = history.filter(p => p.status === 'APPROVED');
  const historyList = history.filter(p => p.status !== 'APPROVED');

  return (
    <div className="visitors-container">
      <Sidebar role="student" />
      
      <main className="visitors-main">
        <header className="visitors-header animate-fade-in">
          <div className="header-left">
            <h2>Visitor Management</h2>
            <p>Register guests, request entry passes, and manage visitor access to the premises.</p>
          </div>
        </header>

        <div className="visitors-content animate-slide-up">
          <div className="request-card card">
            <div className="sec-header-flex">
              <div className="sec-header">
                <PlusCircle size={24} color="#003B46" />
                <h3>Request New Visitor Pass</h3>
              </div>
              <button className="btn-guidelines">Visitor Guidelines</button>
            </div>
            <p className="hint">Submit a request for your guest's entry approval</p>

            <form className="v-form" onSubmit={handleSubmit}>
              <div className="v-row">
                <div className="input-group">
                  <label>Visitor Full Name</label>
                  <input type="text" name="visitorName" value={formData.visitorName} onChange={handleChange} placeholder="Enter full name of guest" required />
                </div>
                <div className="input-group">
                  <label>Visit Date</label>
                  <input type="date" name="visitDate" value={formData.visitDate} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Purpose of Visit</label>
                  <textarea name="purpose" value={formData.purpose} onChange={handleChange} placeholder="Explain the reason for the visit..." required></textarea>
                </div>
              </div>

              <div className="v-row">
                <div className="input-group">
                  <label>Relationship</label>
                  <select name="relationship" value={formData.relationship} onChange={handleChange}>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Friend">Friend</option>
                    <option value="Relative">Relative</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Time In</label>
                  <input type="time" name="timeIn" value={formData.timeIn} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Time Out</label>
                  <input type="time" name="timeOut" value={formData.timeOut} onChange={handleChange} required />
                </div>
              </div>

              <button type="submit" className="btn-primary-v">
                <CheckCircle size={18} /> Submit Pass Request
              </button>
            </form>
          </div>

          <div className="active-passes-section">
            <div className="sec-header">
              <CheckCircle size={20} color="#00A86B" />
              <h3>Active & Approved Passes</h3>
              <span className="count">{activePasses.length} Active Passes</span>
            </div>

            <div className="pass-grid">
              {activePasses.map(pass => (
                <div key={pass._id} id={`pass-${pass._id}`} className="pass-card card">
                  <div className="p-header">
                    <div>
                      <span className="p-id">PASS #{pass._id.substring(pass._id.length - 6).toUpperCase()}</span>
                      <span className="p-tag">VALID PASS</span>
                    </div>
                  </div>
                  <h4>{pass.visitorName}</h4>
                  <span className="p-rel">{pass.relationship}</span>

                  <div className="p-times">
                    <div className="p-time">
                      <span>ARRIVAL</span>
                      <strong>{formatTime(pass.timeIn)}</strong>
                    </div>
                    <div className="p-time">
                      <span>DEPARTURE</span>
                      <strong>{formatTime(pass.timeOut)}</strong>
                    </div>
                    <div className="p-time">
                      <span>DATE</span>
                      <strong>{new Date(pass.visitDate).toLocaleDateString()}</strong>
                    </div>
                  </div>

                  <div className="p-actions">
                    <div className="qr-box">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${pass._id}`} 
                        alt="QR Code" 
                        style={{ width: '40px', height: '40px' }}
                      />
                    </div>
                    <button className="btn-download" onClick={() => downloadPass(pass)}>
                      Download PDF <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {activePasses.length === 0 && <p className="no-passes">No approved passes available.</p>}
            </div>
          </div>

          <div className="history-section card">
            <div className="sec-header">
              <Clock size={20} color="#003B46" />
              <h3>Request History & Status</h3>
            </div>

            <table className="v-table">
              <thead>
                <tr>
                  <th>VISITOR</th>
                  <th>RELATIONSHIP</th>
                  <th>DATE & TIME</th>
                  <th>PURPOSE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id}>
                    <td>
                      <div className="v-user">
                        <div className="avatar">{h.visitorName.split(' ').map(n => n[0]).join('')}</div>
                        <strong>{h.visitorName}</strong>
                      </div>
                    </td>
                    <td>{h.relationship}</td>
                    <td>
                      <div className="v-datetime">
                        <strong>{new Date(h.visitDate).toLocaleDateString()}</strong>
                        <span>{formatTime(h.timeIn)} - {formatTime(h.timeOut)}</span>
                      </div>
                    </td>
                    <td className="v-purpose">{h.purpose}</td>
                    <td>
                      <span className={`v-status ${h.status.toLowerCase()}`}>
                        {h.status}
                      </span>
                    </td>
                    <td>
                      {h.status === 'REJECTED' && (
                        <div className="rejection-info" title={h.rejectionReason}>
                          <AlertCircle size={18} color="#E63946" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan="6">No history found.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Visitors;
