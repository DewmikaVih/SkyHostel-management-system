import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Phone, User, Shield, Save, X, Edit3, Camera, BadgeCheck, Briefcase } from 'lucide-react';
import './AdminProfile.css';

const AdminProfile = () => {
  const { user, updateUser, loading: authLoading } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    profilePicture: '',
    dob: '',
    gender: '',
    nic: '',
    homeAddress: '',
    staffId: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profilePicture || '',
        dob: user.dob || '',
        gender: user.gender || 'Male',
        nic: user.nic || '',
        homeAddress: user.homeAddress || '',
        staffId: user.staffId || ''
      });
    }
  }, [user, authLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { email, ...updatePayload } = formData;
      const res = await api.put('/auth/profile', updatePayload);
      updateUser(res.data);
      setIsEditing(false);
      alert('Admin profile updated successfully!');
    } catch (err) {
      alert('Error updating profile');
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${user?.fullName}&background=003B46&color=fff&size=200`;

  if (authLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page-container">
      <Sidebar role="admin" />
      
      <main className="profile-main">
        <header className="profile-header animate-fade-in">
          <div className="header-titles">
            <h2>Admin Settings</h2>
            <p>Manage your professional administrative profile</p>
          </div>
          {!isEditing ? (
            <button className="btn-edit-toggle" onClick={() => setIsEditing(true)}>
              <Edit3 size={18} /> Edit Professional Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn-save-profile" onClick={handleSubmit}><Save size={18} /> Save Changes</button>
              <button className="btn-cancel-profile" onClick={() => setIsEditing(false)}><X size={18} /> Cancel</button>
            </div>
          )}
        </header>

        <div className="profile-content-grid admin-grid">
          <div className="profile-summary-card card animate-fade-in delay-1">
            <div className="admin-avatar-section">
              <div className={`p-image-container ${isEditing ? 'editing-image' : ''}`}>
                <img src={formData.profilePicture || defaultAvatar} alt="Profile" />
                {isEditing && (
                  <label className="upload-overlay">
                    <Camera size={24} />
                    <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                    <span>Upload Logo</span>
                  </label>
                )}
              </div>
              <div className="admin-main-info">
                <div className="role-tag">
                  <Shield size={14} />
                  <span>SYSTEM ADMINISTRATOR</span>
                </div>
                <h1>{formData.fullName}</h1>
                <p className="staff-id">Staff ID: <span>{formData.staffId || 'ADMIN-CORE-001'}</span></p>
              </div>
            </div>

            <div className="admin-quick-stats">
              <div className="stat-box">
                <BadgeCheck size={20} color="#00A86B" />
                <div>
                  <label>Verification Status</label>
                  <p>Verified Warden</p>
                </div>
              </div>
              <div className="stat-box">
                <Briefcase size={20} color="#3B82F6" />
                <div>
                  <label>Primary Office</label>
                  <p>Main Admin Block</p>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-details-grid animate-slide-up delay-2">
            <div className="details-col card">
              <div className="col-header">
                <User size={20} className="col-icon" />
                <h4>Account Information</h4>
              </div>
              <div className="details-list">
                <div className="detail-item">
                  <span className="d-label">FULL NAME</span>
                  {isEditing ? (
                    <input name="fullName" value={formData.fullName} onChange={handleChange} />
                  ) : (
                    <p>{formData.fullName}</p>
                  )}
                </div>
                <div className="detail-item">
                  <span className="d-label">OFFICIAL EMAIL</span>
                  <p className="readonly-text">{formData.email}</p>
                </div>
                <div className="detail-item">
                  <span className="d-label">CONTACT NUMBER</span>
                  {isEditing ? (
                    <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                  ) : (
                    <p>{formData.phoneNumber || 'Not Set'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="details-col card">
              <div className="col-header">
                <Shield size={20} className="col-icon" />
                <h4>Personal & Security</h4>
              </div>
              <div className="details-list">
                <div className="detail-item">
                  <span className="d-label">NIC / PASSPORT</span>
                  {isEditing ? (
                    <input name="nic" value={formData.nic} onChange={handleChange} />
                  ) : (
                    <p>{formData.nic || 'Not Verified'}</p>
                  )}
                </div>
                <div className="detail-item">
                  <span className="d-label">RESIDENTIAL ADDRESS</span>
                  {isEditing ? (
                    <textarea name="homeAddress" value={formData.homeAddress} onChange={handleChange} />
                  ) : (
                    <p>{formData.homeAddress || 'No Address Provided'}</p>
                  )}
                </div>
                <div className="detail-item">
                   <span className="d-label">STAFF DESIGNATION</span>
                   <p>Chief Hall Warden</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProfile;
