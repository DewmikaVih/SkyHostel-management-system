import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Upload, CheckCircle, Clock, AlertCircle, Star, Send, X } from 'lucide-react';
import './Maintenance.css';

const Maintenance = () => {
  const { user, updateUser, loading: authLoading } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: 'Plumbing', description: '' });
  const [feedbackData, setFeedbackData] = useState({ comment: '', rating: 5 });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllRequests, setShowAllRequests] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    const fetchData = async () => {
      try {
        const [meRes, reqRes, feedRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/maintenance/my-tickets'),
          api.get('/feedback')
        ]);

        updateUser(meRes.data);
        setRequests(reqRes.data);
        setFeedbacks(feedRes.data.slice(0, 3));

        if (meRes.data.assignedRoomId) {
          try {
            const roomRes = await api.get(`/rooms/${meRes.data.assignedRoomId}`);
            setRoomData(roomRes.data);
          } catch (roomErr) {
            if (roomErr.response?.status === 404) {
              updateUser({ ...meRes.data, assignedRoomId: null });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authLoading]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (e) => {
    e.stopPropagation(); // Prevent triggering the file input click
    setImage(null);
    document.getElementById('fileInput').value = ''; // Reset input
  };

  const handleFeedbackChange = (e) => {
    setFeedbackData({ ...feedbackData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.assignedRoomId) {
      alert('You must have an assigned room to report an issue.');
      return;
    }
    try {
      await api.post('/maintenance', {
        ...formData,
        roomId: user.assignedRoomId,
        imageUrl: image // Sending base64 string
      });
      alert('Issue reported successfully!');
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error reporting issue');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/feedback', feedbackData);
      alert('Feedback submitted! Thank you.');
      window.location.reload();
    } catch (err) {
      alert('Error submitting feedback');
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
    <div className="maintenance-container">
      <Sidebar role="student" />

      <main className="maintenance-main">
        <header className="maintenance-header animate-fade-in">
          <div className="header-left">
            <h2>Maintenance Management</h2>
            <p>Report issues and track resolution status for your room and hostel facilities.</p>
          </div>
        </header>

        <div className="maintenance-content animate-slide-up">
          <div className="report-section card">
            <div className="sec-header">
              <CheckCircle size={20} color="#00A86B" />
              <h3>Report an Issue</h3>
            </div>

            <form className="m-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Issue Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Leaking bathroom faucet" required />
              </div>

              <div className="m-row">
                <div className="input-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Room Number</label>
                  <input type="text" value={roomData?.roomNumber || 'Not Allocated'} disabled />
                </div>
              </div>

              <div className="input-group">
                <label>Detailed Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the issue in detail..." required></textarea>
              </div>

              <div
                className={`upload-box ${image ? 'has-file' : ''}`}
                onClick={() => document.getElementById('fileInput').click()}
                style={{ cursor: 'pointer', padding: image ? '10px' : '40px' }}
              >
                <input
                  type="file"
                  id="fileInput"
                  hidden
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {image ? (
                  <div className="img-preview-container">
                    <img src={image} alt="Preview" className="m-img-preview" />
                    <button className="btn-remove-img" onClick={removeImage}>
                      <X size={16} />
                    </button>
                    <div className="preview-overlay">
                      <Upload size={24} />
                      <span>Change Image</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={32} />
                    <p><strong>Click to upload</strong> or drag and drop</p>
                    <span>PNG, JPG or JPEG (MAX. 5MB)</span>
                  </>
                )}
              </div>

              <button type="submit" className="btn-primary-m">Submit Request</button>
            </form>
          </div>

          <div className="history-section">
            <div className="card m-history">
              <div className="sec-header-flex">
                <div className="sec-header">
                  <Clock size={20} color="#003B46" />
                  <h3>My Requests</h3>
                </div>
                <button className="view-all-link" onClick={() => setShowAllRequests(true)}>View All</button>
              </div>

              <table className="m-table">
                <thead>
                  <tr>
                    <th>ISSUE ID</th>
                    <th>CATEGORY</th>
                    <th>DATE REPORTED</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.slice(0, 5).map(req => (
                    <tr key={req._id}>
                      <td><strong>#{req._id.substring(req._id.length - 6).toUpperCase()}</strong></td>
                      <td>{req.category}</td>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>{getStatusBadge(req.status)}</td>
                    </tr>
                  ))}
                  {requests.length === 0 && <tr><td colSpan="4">No requests found.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="card m-feedback">
              <div className="sec-header">
                <Star size={20} color="#003B46" />
                <h3>Community Feedback</h3>
              </div>

              <form className="f-submit-form" onSubmit={handleFeedbackSubmit}>
                <textarea
                  name="comment"
                  value={feedbackData.comment}
                  onChange={handleFeedbackChange}
                  placeholder="Share your experience with our maintenance service..."
                  required
                ></textarea>
                <div className="f-bottom">
                  <div className="f-rating-input">
                    {[1, 2, 3, 4, 5].map(num => (
                      <Star
                        key={num}
                        size={18}
                        fill={num <= feedbackData.rating ? "#FBBF24" : "none"}
                        color={num <= feedbackData.rating ? "#FBBF24" : "#CBD5E0"}
                        onClick={() => setFeedbackData({ ...feedbackData, rating: num })}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                  <button type="submit" className="btn-send"><Send size={16} /> Submit</button>
                </div>
              </form>

              <div className="feedback-list">
                {feedbacks.map((f, i) => (
                  <div key={i} className="f-item">
                    <div className="f-user">
                      <img
                        src={f.studentId?.profilePicture || `https://ui-avatars.com/api/?name=${f.fullName}&background=random`}
                        alt={f.fullName}
                        className="f-avatar"
                      />
                      <div className="f-user-info">
                        <strong>{f.fullName}</strong>
                        <span>{new Date(f.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="f-stars">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={14} fill={j < f.rating ? "#FBBF24" : "none"} color={j < f.rating ? "#FBBF24" : "#CBD5E0"} />
                        ))}
                      </div>
                    </div>
                    <p>"{f.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* View All Requests Modal */}
        {showAllRequests && (
          <div className="modal-overlay" onClick={() => setShowAllRequests(false)}>
            <div className="m-history-modal card animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="m-title">
                  <Clock size={20} color="#003B46" />
                  <h3>Maintenance Request History</h3>
                </div>
                <button className="btn-close" onClick={() => setShowAllRequests(false)}><X size={24} /></button>
              </div>
              <div className="modal-body">
                <table className="m-table">
                  <thead>
                    <tr>
                      <th>ISSUE ID</th>
                      <th>CATEGORY</th>
                      <th>TITLE</th>
                      <th>DATE REPORTED</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req._id}>
                        <td><strong>#{req._id.substring(req._id.length - 6).toUpperCase()}</strong></td>
                        <td>{req.category}</td>
                        <td>{req.title}</td>
                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td>{getStatusBadge(req.status)}</td>
                      </tr>
                    ))}
                    {requests.length === 0 && <tr><td colSpan="5">No requests found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Maintenance;
