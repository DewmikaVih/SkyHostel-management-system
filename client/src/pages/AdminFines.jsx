import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { Search, CreditCard, AlertCircle, History, CheckCircle, User, DollarSign, Text, Image as ImageIcon, X, Clock } from 'lucide-react';
import './AdminFines.css';

const AdminFines = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [fineAmount, setFineAmount] = useState('');
  const [fineReason, setFineReason] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);
  const [viewingSlip, setViewingSlip] = useState(null);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await api.get('/fines');
      setFines(res.data);
    } catch (err) {
      console.error('Error fetching fines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/auth/students/search?query=${val}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search error');
    }
  };

  const handleIssueFine = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !fineAmount || !fineReason) {
      alert('Please fill all fields');
      return;
    }

    setIssuing(true);
    try {
      await api.post('/fines', {
        studentId: selectedStudent._id,
        amount: fineAmount,
        reason: fineReason
      });
      alert('Fine issued successfully');
      setSelectedStudent(null);
      setFineAmount('');
      setFineReason('');
      setSearchQuery('');
      setSearchResults([]);
      fetchFines();
    } catch (err) {
      alert('Error issuing fine');
    } finally {
      setIssuing(false);
    }
  };

  const handleVerifyPayment = async (fineId) => {
    if (!window.confirm('Confirm that the payment slip is valid?')) return;

    setVerifyingId(fineId);
    try {
      await api.put(`/fines/${fineId}/verify`);
      alert('Payment verified and balance updated.');
      fetchFines();
    } catch (err) {
      alert('Verification failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteFine = async (fineId) => {
    if (!window.confirm('Are you sure you want to close this fine? This will remove the record from the active history.')) return;

    try {
      await api.delete(`/fines/${fineId}`);
      alert('Fine record removed.');
      fetchFines();
    } catch (err) {
      alert('Failed to remove record');
    }
  };

  const pendingFines = fines.filter(f => f.status === 'PENDING');
  const otherFines = fines.filter(f => f.status !== 'PENDING');

  return (
    <div className="admin-fines-container">
      <Sidebar role="admin" />

      <main className="admin-main">
        <header className="admin-header animate-fade-in">
          <div className="header-left">
            <h2>Fine & Penalty Management</h2>
            <p>Issue and verify disciplinary payments</p>
          </div>
        </header>

        <div className="fines-grid animate-slide-up">
          <div className="fines-left-col">
            {/* Pending Payments Section */}
            {pendingFines.length > 0 && (
              <section className="pending-payments-section">
                <div className="card pending-card animate-fade-in">
                  <div className="card-header warning-header">
                    <Clock size={20} color="#D97706" />
                    <h3>Pending Verifications ({pendingFines.length})</h3>
                  </div>
                  <div className="pending-list">
                    {pendingFines.map(fine => (
                      <div key={fine._id} className="pending-item">
                        <div className="p-info">
                          <strong>{fine.student?.fullName}</strong>
                          <span>{fine.reason}</span>
                          <span className="p-amount">LKR {fine.amount}.00</span>
                        </div>
                        <div className="p-actions">
                          <button
                            className="btn-view-slip"
                            onClick={() => setViewingSlip(fine.paymentSlip)}
                          >
                            <ImageIcon size={16} /> View Slip
                          </button>
                          <button
                            className="btn-approve"
                            disabled={verifyingId === fine._id}
                            onClick={() => handleVerifyPayment(fine._id)}
                          >
                            {verifyingId === fine._id ? '...' : 'Verify'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Issue Fine Form */}
            <section className="issue-fine-section">
              <div className="card issue-card">
                <div className="card-header">
                  <CreditCard size={20} color="#E63946" />
                  <h3>Issue New Fine</h3>
                </div>
                <form onSubmit={handleIssueFine} className="fine-form">
                  <div className="form-group">
                    <label>Search Student (Name or Reg No)</label>
                    <div className="search-input-wrapper">
                      <Search size={18} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Type to search..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                      {searchResults.length > 0 && (
                        <div className="search-dropdown">
                          {searchResults.map(s => (
                            <div
                              key={s._id}
                              className="search-result-item"
                              onClick={() => {
                                setSelectedStudent(s);
                                setSearchQuery(s.fullName);
                                setSearchResults([]);
                              }}
                            >
                              <strong>{s.fullName}</strong>
                              <span>{s.regNumber}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedStudent && (
                    <div className="selected-student-box animate-fadeIn">
                      <div className="s-icon"><User size={16} /></div>
                      <div className="s-details">
                        <span>Issuing to</span>
                        <strong>{selectedStudent.fullName}</strong>
                        <p>{selectedStudent.regNumber}</p>
                      </div>
                      <button type="button" className="btn-remove" onClick={() => setSelectedStudent(null)}>×</button>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Amount (LKR)</label>
                      <div className="amount-input">
                        <span className="currency-prefix">LKR</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={fineAmount}
                          onChange={(e) => setFineAmount(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Penalty Reason</label>
                    <textarea
                      placeholder="Describe the disciplinary violation..."
                      value={fineReason}
                      onChange={(e) => setFineReason(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn-issue" disabled={issuing}>
                    {issuing ? 'Processing...' : 'Issue Penalty Fine'}
                  </button>
                </form>
              </div>
            </section>
          </div>

          {/* Fines History */}
          <section className="fines-history-section">
            <div className="card history-card">
              <div className="card-header">
                <History size={20} />
                <h3>Recent Penalties</h3>
              </div>
              <div className="history-list">
                {loading ? (
                  <p className="loading-text">Loading fines...</p>
                ) : otherFines.length > 0 ? (
                  otherFines.map(fine => (
                    <div key={fine._id} className={`fine-history-item ${fine.status.toLowerCase()}`}>
                      <div className="fh-top">
                        <div className="fh-student">
                          <strong>{fine.student?.fullName}</strong>
                          <span>{fine.student?.regNumber}</span>
                        </div>
                        <div className="fh-amount">LKR {fine.amount}.00</div>
                      </div>
                      <div className="fh-reason">
                        <AlertCircle size={14} />
                        <p>{fine.reason}</p>
                      </div>
                      <div className="fh-footer">
                        <div className="fh-status-group">
                          <span className={`status-tag ${fine.status.toLowerCase()}`}>{fine.status}</span>
                          {fine.status === 'PAID' && (
                            <button
                              className="btn-close-fine"
                              onClick={() => handleDeleteFine(fine._id)}
                              title="Archive/Close resolved penalty"
                            >
                              Close Fine
                            </button>
                          )}
                        </div>
                        <span>{new Date(fine.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <CheckCircle size={40} color="#00A86B" />
                    <p>No penalties issued yet.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Slip Viewer Modal */}
        {viewingSlip && (
          <div className="modal-overlay" onClick={() => setViewingSlip(null)}>
            <div className="slip-viewer-modal animate-fadeIn" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Payment Slip</h3>
                <button className="btn-close" onClick={() => setViewingSlip(null)}><X size={24} /></button>
              </div>
              <div className="slip-content">
                <img src={viewingSlip} alt="Payment Slip" />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminFines;
