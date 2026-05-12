import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import './Login.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-visual animate-fade-in">
        <div className="visual-content">
          <h1>SkyHostel</h1>
          <p className="subtitle">Secure Password Reset</p>
        </div>
      </div>

      <div className="login-form-section">
        <div className="form-wrapper">
          {!success ? (
            <div className="animate-slide-up">
              <div className="form-header">
                <h2>Set New Password</h2>
                <p>Please enter a strong password for your account.</p>
              </div>

              {error && <div className="error-alert">{error}</div>}

              <form onSubmit={handleReset}>
                <div className="input-group">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Confirm New Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={18} />
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-slide-up text-center">
              <div className="success-icon-wrapper">
                <CheckCircle size={80} color="#00A86B" />
              </div>
              <div className="form-header">
                <h2>Password Reset!</h2>
                <p>Your password has been successfully updated. You can now log in.</p>
              </div>
              <button className="btn-primary" onClick={() => navigate('/login')}>Go to Login</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
