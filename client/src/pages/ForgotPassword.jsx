import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ShieldCheck, Key, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../services/api';
import './Login.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Success message
  const [identifier, setIdentifier] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { identifier, role });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { identifier, otp, role });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-visual animate-fade-in">
        <div className="visual-content">
          <h1>SkyHostel</h1>
          <p className="subtitle">Account Recovery System</p>
          <div className="f-card">
            <ShieldCheck size={20} />
            <div>
              <h4>Secure Verification</h4>
              <p>We use multi-factor authentication to keep your hostel data safe.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="login-form-section">
        <div className="form-wrapper">
          {step === 1 && (
            <div className="animate-slide-up">
              <div className="form-header">
                <h2>Forgot Password?</h2>
                <p>Enter your registered ID/Email to receive a verification OTP.</p>
              </div>

              <div className="role-toggle">
                <button className={role === 'STUDENT' ? 'active' : ''} onClick={() => setRole('STUDENT')}>Student</button>
                <button className={role === 'ADMIN' ? 'active' : ''} onClick={() => setRole('ADMIN')}>Admin</button>
              </div>

              {error && <div className="error-alert">{error}</div>}

              <form onSubmit={handleSendOtp}>
                <div className="input-group">
                  <label>Registration Number / Email</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g. AS2022xxx" 
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'} <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up">
              <div className="form-header">
                <h2>Verify Identity</h2>
                <p>We've sent a 6-digit code to your registered email.</p>
              </div>

              {error && <div className="error-alert">{error}</div>}

              <form onSubmit={handleVerifyOtp}>
                <div className="input-group">
                  <label>Enter OTP</label>
                  <div className="input-wrapper">
                    <Key className="input-icon" size={18} />
                    <input 
                      type="text" 
                      placeholder="######" 
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
              <button className="btn-text" onClick={() => setStep(1)}>Back to Start</button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-slide-up text-center">
              <div className="success-icon-wrapper">
                <CheckCircle size={80} color="#00A86B" />
              </div>
              <div className="form-header">
                <h2>Identity Verified!</h2>
                <p>Check your email again. We've sent a secure link to reset your password.</p>
              </div>
              <button className="btn-primary" onClick={() => navigate('/login')}>Back to Login</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
