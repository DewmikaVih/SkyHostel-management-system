import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Hash, Phone, Lock, School, Calendar, Building2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Register.css';

const RegisterStudent = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    regNumber: '',
    email: '',
    faculty: '',
    academicYear: '',
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
      await register({ ...formData, role: 'STUDENT' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="register-container">
      <div className="register-visual student-bg animate-fade-in">
        <div className="visual-overlay">
          <div className="logo-section animate-slide-up">
            <Building2 className="logo-icon" size={40} />
            <h1>SkyHostel</h1>
          </div>
          <div className="visual-text animate-slide-up delay-1">
            <h2>Join our Community</h2>
            <p>Experience modern hostel living with seamless management</p>
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
            <h2>Student Registration</h2>
            <p>Fill in your details to get started with your hostel journey.</p>
          </div>

          {error && <div className="error-alert animate-fade-in">{error}</div>}

          <form onSubmit={handleSubmit} className="animate-slide-up delay-1">
            <div className="input-group full">
              <label><User size={14} /> Full Name</label>
              <input
                name="fullName"
                type="text"
                placeholder="e.g. Supun Perera"
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-row">
              <div className="input-group">
                <label><Hash size={14} /> Registration Number</label>
                <input
                  name="regNumber"
                  type="text"
                  placeholder="AS2024xxx"
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <label><Mail size={14} /> University Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="AS2024xxx@sci.sjp.ac.lk"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label><School size={14} /> Faculty</label>
                <select name="faculty" onChange={handleChange} required>
                  <option value="">Select Faculty</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business">Business</option>
                  <option value="Computing">Computing</option>
                </select>
              </div>
              <div className="input-group">
                <label><Calendar size={14} /> Academic Year</label>
                <select name="academicYear" onChange={handleChange} required>
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
            </div>

            <div className="input-group full">
              <label><Phone size={14} /> Phone Number</label>
              <input
                name="phoneNumber"
                type="tel"
                placeholder="+94 7x xxx xx xx"
                onChange={handleChange}
                required
              />
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

            <button type="submit" className="btn-primary-teal full-width hover-lift">Register & Join</button>
          </form>

          <div className="animate-slide-up delay-2">
            <p className="form-footer">
              Already have an account? <a href="/login">Sign In</a>
            </p>

            <div className="footer-links-right">
              <a href="#">PRIVACY POLICY</a>
              <a href="#">TERMS OF SERVICE</a>
              <a href="#">SECURITY STANDARDS</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
