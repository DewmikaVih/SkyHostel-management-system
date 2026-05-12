import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Building2, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('STUDENT');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login({ identifier, password, role });
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        if (user.assignedRoomId) {
          navigate('/dashboard');
        } else {
          navigate('/allocation');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      {/* Left Section: Branding & Info */}
      <div className="login-visual animate-fade-in">
        <div className="visual-content">
          <div className="logo-section animate-slide-up">
            <Building2 className="logo-icon" size={40} />
            <h1>SkyHostel</h1>
          </div>
          <p className="subtitle animate-slide-up delay-1">Transforming university accommodation into a streamlined, automated ecosystem</p>

          <div className="feature-cards animate-slide-up delay-2">
            <div className="f-card hover-lift">
              <ShieldCheck size={20} className="f-icon" />
              <div>
                <h4>Dynamic Attendance Tracking</h4>
                <p>Monitor student movements and curfew status in real-time</p>
              </div>
            </div>
            <div className="f-card hover-lift">
              <ShieldCheck size={20} className="f-icon" />
              <div>
                <h4>Encrypted Identity Management</h4>
                <p>High-security digital credentials for every resident student</p>
              </div>
            </div>
          </div>

          <div className="visual-footer">
            <div className="dot"></div>
            <span>Optimized for large-scale university accommodation management.</span>
          </div>
        </div>
      </div>

      {/* Right Section: Form */}
      <div className="login-form-section">
        <div className="form-wrapper">
          <div className="form-header animate-slide-up">
            <h2>Welcome to SkyHostel</h2>
            <p>Please select your account type and sign in.</p>
          </div>

          <div className="role-toggle animate-slide-up delay-1">
            <button
              className={role === 'STUDENT' ? 'active' : ''}
              onClick={() => setRole('STUDENT')}
            >
              <User size={18} /> Student Login
            </button>
            <button
              className={role === 'ADMIN' ? 'active' : ''}
              onClick={() => setRole('ADMIN')}
            >
              <ShieldCheck size={18} /> Admin Login
            </button>
          </div>

          {error && <div className="error-alert animate-fade-in">{error}</div>}

          <form onSubmit={handleLogin} className="animate-slide-up delay-2">
            <div className="input-group">
              <label>{role === 'STUDENT' ? 'Registration Number' : 'Staff ID'}</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder={role === 'STUDENT' ? 'e.g. AS2024XXX' : 'e.g. WDXXXX'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-flex">
                <label>Password</label>
                <a href="/forgot-password" style={{ fontSize: '12px', color: '#003B46', fontWeight: '600', textDecoration: 'none' }}>Reset Access</a>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" /> Keep me signed in
              </label>
            </div>

            <button type="submit" className="btn-primary">
              Enter {role === 'STUDENT' ? 'Student' : 'Admin'} Portal
            </button>
          </form>

          <div className="animate-slide-up delay-3">
            <p className="form-footer">
              Don't have an account? <a href={role === 'STUDENT' ? '/register' : '/register-admin'}>Create an account</a>
            </p>

            {/* <p className="contact-desk">
              Having trouble signing in? <a href="#">Contact Desk</a>
            </p> */}
          </div>

          <div className="copyright">
            <span>© 2026 SKYHOSTEL MANAGEMENT SYSTEMS. ALL RIGHTS RESERVED</span>
            <div className="footer-links">
              <a href="#">Help Center</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
