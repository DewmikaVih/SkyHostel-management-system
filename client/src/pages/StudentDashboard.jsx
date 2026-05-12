import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';
import { Wifi, Thermometer, Shield, CreditCard, ChevronRight, Clock, Calendar, LogOut, X, AlertCircle, Upload, CheckCircle, Image as ImageIcon, History } from 'lucide-react';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const { user, updateUser, loading: authLoading } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentFines, setStudentFines] = useState([]);
  const [lateHistory, setLateHistory] = useState([]);
  const [showFineModal, setShowFineModal] = useState(false);
  const [showLateModal, setShowLateModal] = useState(false);
  const [uploadingFineId, setUploadingFineId] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const meRes = await api.get('/auth/me');
      updateUser(meRes.data);

      if (meRes.data.assignedRoomId) {
        try {
          const roomRes = await api.get(`/rooms/${meRes.data.assignedRoomId}`);
          setRoomData(roomRes.data);
        } catch (roomErr) {
          console.warn('Could not fetch room details');
        }
      }

      const [finesRes, lateRes, noticesRes] = await Promise.all([
        api.get(`/fines/student/${meRes.data._id}`),
        api.get('/visitors/attendance/late-details'),
        api.get('/canteen/notices')
      ]);

      setStudentFines(finesRes.data);
      setLateHistory(lateRes.data);
      setNotices(noticesRes.data.slice(0, 2));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchData();

    // Socket for real-time room updates
    const socket = io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    socket.on('room_status_update', (data) => {
      setRoomData(prev => {
        if (prev && prev._id === data.roomId) {
          return { ...prev, status: data.status };
        }
        return prev;
      });
    });

    return () => socket.disconnect();
  }, [authLoading]);

  const handleAttendance = async (type) => {
    try {
      const res = await api.post('/visitors/attendance', { type });
      updateUser({ ...user, status: res.data.status, lateEntries: res.data.lateEntries, monthlyLateEntries: res.data.monthlyLateEntries });
      alert(`Status updated to ${type}. Admin notified.`);
      fetchData(); // Refresh to see new late entries
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleSlipUpload = async (e, fineId) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setUploadingFineId(fineId);
        await api.put(`/fines/${fineId}/pay`, { paymentSlip: reader.result });
        alert('Payment slip uploaded successfully. Waiting for admin verification.');
        fetchData();
      } catch (err) {
        alert('Error uploading slip');
      } finally {
        setUploadingFineId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${user?.fullName}&background=003B46&color=fff&size=128`;
  const latestFine = studentFines.find(f => f.status !== 'PAID') || studentFines[0];
  const isLateWarning = (user?.monthlyLateEntries || 0) >= 7;

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="dashboard-container">
      <Sidebar role="student" />

      <main className="dashboard-main">
        <header className="dashboard-header animate-fade-in">
          <div className="header-left">
            <h2>Student DashBoard</h2>
            <p className="header-date">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>
          <div className="header-right">
            <div className="user-profile-summary" onClick={() => navigate('/profile')}>
              <div className="u-info">
                <span className="u-name">{user?.fullName}</span>
                <span className="u-reg">{user?.regNumber}</span>
              </div>
              <div className="u-avatar">
                <img src={user?.profilePicture || defaultAvatar} alt="Profile" />
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="content-left">
            <div className="assigned-room-card animate-slide-up delay-1 hover-lift">
              <div className="card-header">
                <span className="badge-room">ASSIGNED ROOM</span>
                {user?.assignedRoomId ? (
                  roomData ? (
                    <>
                      <h3>Room {roomData.roomNumber}</h3>
                      <p>Floor {roomData.floor} • {roomData.type} Room</p>
                    </>
                  ) : (
                    <>
                      <h3>Loading...</h3>
                      <p>Fetching room details</p>
                    </>
                  )
                ) : (
                  <>
                    <h3>Not Allocated</h3>
                    <p>You haven't selected a room yet.</p>
                  </>
                )}
              </div>
              <div className="card-body-flex">
                {user?.assignedRoomId ? (
                  roomData ? (
                    <>
                      <div className="status-item">
                        <span className="label">Room Status</span>
                        <div className="status-indicator">
                          <div className={`dot-status ${roomData.status?.toLowerCase()}`}></div>
                          <span className="status-text">{roomData.status}</span>
                        </div>
                      </div>
                      <div className="status-item">
                        <span className="label">Roommates</span>
                        <span className="value">
                          {roomData.occupants?.length > 1
                            ? roomData.occupants
                              .filter(o => (o._id || o) !== user._id)
                              .map(o => o.fullName || "Resident")
                              .join(', ')
                            : 'None'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="status-item">
                      <span className="label">Syncing...</span>
                      <span className="value">Connecting to server</span>
                    </div>
                  )
                ) : (
                  <div className="status-item" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <a href="/allocation" className="btn-primary" style={{ padding: '8px 16px', textDecoration: 'none' }}>
                      Go to Allocation Hub
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="financial-card card animate-slide-up delay-2 hover-lift">
              <div className="f-header">
                <div className="f-title">
                  <CreditCard size={20} color="#E63946" />
                  <h4>Fine (Legal Penalty)</h4>
                </div>
                <div className="f-total">
                  <span>TOTAL OUTSTANDING</span>
                  <h3>LKR {user?.penaltyBalance || 0}.00</h3>
                </div>
              </div>
              <p className="f-desc">Outstanding balance and disciplinary actions</p>

              {latestFine ? (
                <div className="fine-item animate-fadeIn">
                  <div className="fine-info">
                    <div className="fine-icon-box">
                      <Shield size={18} />
                    </div>
                    <div>
                      <h5>{latestFine.status === 'PAID' ? 'Paid Penalty' : 'Latest Penalty'}</h5>
                      <p className="fine-reason-text">{latestFine.reason}</p>
                      <span className="fine-date">{new Date(latestFine.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="fine-amount">
                    <span className={`status-pill ${latestFine.status.toLowerCase()}`}>{latestFine.status}</span>
                    LKR {latestFine.amount}.00
                  </div>
                </div>
              ) : (
                <p className="no-fines">No outstanding fines. Good job!</p>
              )}

              <div className="fine-actions">
                <button className="btn-history" onClick={() => setShowFineModal(true)}>View History</button>
              </div>
            </div>

            <div className="counters-row">
              <div className={`counter-card card ${isLateWarning ? 'warning-red-severe' : (user?.monthlyLateEntries >= 5 ? 'warning-red' : '')}`} onClick={() => setShowLateModal(true)}>
                <div className="counter-header-flex">
                  <span>MONTHLY LATE ENTRIES</span>
                  <History size={14} color={isLateWarning ? '#fff' : '#64748B'} />
                </div>
                <h3>{user?.monthlyLateEntries || 0} / 7</h3>
                {isLateWarning ? (
                  <div className="severe-alert">
                    <AlertCircle size={14} />
                    <span>LIMIT EXCEEDED: LKR 250 FINE ADDED</span>
                  </div>
                ) : user?.monthlyLateEntries >= 5 ? (
                  <p className="warning-text">Caution: Approaching monthly limit!</p>
                ) : (
                  <p className="small-hint-text">Limit is 7 per month</p>
                )}
              </div>
              <div className="counter-card card">
                <span>TOTAL LATE ENTRIES</span>
                <h3>{user?.lateEntries || 0}</h3>
                <p>All time total</p>
              </div>
            </div>
          </div>

          <div className="content-right">
            <div className="live-status-card">
              <div className="live-header">
                <span className="l-badge">LIVE TRACKING</span>
                <div className="dot-pulse animate-fade-in"></div>
              </div>
              <h3>Hostel <span>{user?.status === 'OUT' ? 'OUT' : 'IN'}</span> Status</h3>
              <p>Current session: {user?.status === 'OUT' ? 'Currently Outside' : 'Inside Hostel'}</p>

              {user?.status === 'OUT' ? (
                <button className="btn-mark-out" onClick={() => handleAttendance('IN')}>
                  <Clock size={18} /> Mark IN
                </button>
              ) : (
                <>
                  <button
                    className={`btn-mark-out ${new Date().getHours() >= 0 && new Date().getHours() < 3 ? 'disabled' : ''}`}
                    onClick={() => {
                      if (new Date().getHours() >= 0 && new Date().getHours() < 3) {
                        return; // Feature disabled for residents already inside
                      }
                      handleAttendance('OUT');
                    }}
                    disabled={new Date().getHours() >= 0 && new Date().getHours() < 3}
                  >
                    <LogOut size={18} /> Mark OUT
                  </button>
                  {new Date().getHours() >= 0 && new Date().getHours() < 3 && (
                    <p className="restriction-msg">Curfew active. Mark Out is disabled until 03:00 AM.</p>
                  )}
                </>
              )}
              <p className="small-hint">Touch to update your real-time presence</p>
            </div>

            <div className="notices-card card">
              <div className="n-header">
                <h4>Recent Notices</h4>
                <a href="/notices">See All</a>
              </div>
              <div className="notice-list">
                {notices.length > 0 ? notices.map(n => (
                  <div key={n._id} className="notice-item">
                    <div className="n-dot"></div>
                    <div className="n-content">
                      <h5>{n.title}</h5>
                      <p>{n.content.substring(0, 60)}...</p>
                      <span className="n-time">{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )) : <p>No recent notices</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Fine History Modal */}
        {showFineModal && (
          <div className="modal-overlay" onClick={() => setShowFineModal(false)}>
            <div className="fine-history-modal card animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="m-title">
                  <CreditCard size={20} color="#E63946" />
                  <h3>Penalty History</h3>
                </div>
                <button className="btn-close" onClick={() => setShowFineModal(false)}><X size={24} /></button>
              </div>
              <div className="modal-body history-body">
                {studentFines.length > 0 ? (
                  <div className="history-list-student">
                    {studentFines.map(fine => (
                      <div key={fine._id} className="s-fine-item">
                        <div className="sf-left">
                          <AlertCircle size={20} color={fine.status === 'PAID' ? '#10B981' : '#F43F5E'} />
                          <div className="sf-info">
                            <strong>{fine.reason}</strong>
                            <span>{new Date(fine.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="sf-right">
                          <div className="sf-status-box">
                            <span className="sf-amount">LKR {fine.amount}.00</span>
                            <span className={`sf-status ${fine.status.toLowerCase()}`}>{fine.status}</span>
                          </div>

                          {fine.status === 'UNPAID' && (
                            <label className="btn-upload-slip">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleSlipUpload(e, fine._id)}
                                hidden
                              />
                              <Upload size={14} /> Upload Slip
                            </label>
                          )}
                          {fine.status === 'PENDING' && (
                            <div className="pending-badge">
                              <Clock size={14} /> Pending Verification
                            </div>
                          )}
                          {fine.status === 'PAID' && (
                            <div className="paid-badge">
                              <CheckCircle size={14} /> Paid
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-history">No penalty records found.</p>
                )}
              </div>
              <div className="modal-footer">
                <div className="total-fine-summary">
                  <span>Total Outstanding:</span>
                  <strong>LKR {user?.penaltyBalance || 0}.00</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Late Entry History Modal */}
        {showLateModal && (
          <div className="modal-overlay" onClick={() => setShowLateModal(false)}>
            <div className="fine-history-modal card animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="m-title">
                  <Clock size={20} color="#003B46" />
                  <h3>Late Entry Log</h3>
                </div>
                <button className="btn-close" onClick={() => setShowLateModal(false)}><X size={24} /></button>
              </div>
              <div className="modal-body history-body">
                <p className="history-desc">Curfew is 11:59 PM. Entries after midnight are recorded as late.</p>
                {lateHistory.length > 0 ? (
                  <div className="history-list-student">
                    {lateHistory.map(entry => (
                      <div key={entry._id} className="s-fine-item">
                        <div className="sf-left">
                          <Clock size={20} color="#64748B" />
                          <div className="sf-info">
                            <strong>Late Return</strong>
                            <span>{new Date(entry.time).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="sf-right">
                          <span className="sf-status violation">LATE</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-history">No late entries recorded. Keep it up!</p>
                )}
              </div>
              <div className="modal-footer">
                <div className={`monthly-status-footer ${isLateWarning ? 'danger' : ''}`}>
                  <span>This Month's Progress:</span>
                  <strong>{user?.monthlyLateEntries || 0} / 7 Entries</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
