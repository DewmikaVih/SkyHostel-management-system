import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Hash, Phone, Lock, Building2, Briefcase } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Register.css';

const RegisterAdmin = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    staffId: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      await register({ ...formData, role: 'ADMIN' });
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="register-container">
      <div className="register-visual admin-bg animate-fade-in">
        <div className="visual-overlay">
          <div className="logo-section animate-slide-up">
            <Building2 className="logo-icon" size={40} />
            <h1>SkyHostel</h1>
          </div>
          <div className="visual-text animate-slide-up delay-1">
            <h2>Smart Hostel Administration</h2>
            <p>Digitizing the transition from manual ledger entries to an automated, high-efficiency ecosystem</p>
          </div>
          <div className="slider-dots">
            <div className="dot active"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
        <div className="visual-footer-left">
          <p>© 2026 SKYHOSTEL MANAGEMENT SYSTEMS. ALL RIGHTS RESERVED</p>
        </div>
      </div>

      <div className="register-form-section">
        <div className="form-wrapper">
          <div className="form-header animate-slide-up">
            <h2>Admin Registration</h2>
            <p>Create your administrator account to manage hostel system</p>
          </div>

          {error && <div className="error-alert animate-fade-in">{error}</div>}

          <form onSubmit={handleSubmit} className="animate-slide-up delay-1">
            <div className="input-group full">
              <label><User size={14} /> Full Name</label>
              <input
                name="fullName"
                type="text"
                placeholder="Jagath Rajapaksha"
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group full">
              <label><Briefcase size={14} /> Staff ID</label>
              <input
                name="staffId"
                type="text"
                placeholder="WDxxxx"
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label><Mail size={14} /> Official Email Address</label>
                <input
                  name="email"
                  type="email"
                  placeholder="adminxxx@sci.sjp.ac.lk"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label><Phone size={14} /> Phone Number</label>
                <input
                  name="phoneNumber"
                  type="tel"
                  placeholder="+94 7x xxx xx xx"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label><Lock size={14} /> Create Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label><Lock size={14} /> Confirm Password</label>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary-teal full-width hover-lift">Register and Join</button>
          </form>

          <p className="form-footer">
            Already have an admin account? <a href="/login">Sign In</a>
          </p>

          <div className="footer-links-right">
            <a href="#">PRIVACY POLICY</a>
            <a href="#">TERMS OF SERVICE</a>
            <a href="#">SECURITY STANDARDS</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterAdmin;
