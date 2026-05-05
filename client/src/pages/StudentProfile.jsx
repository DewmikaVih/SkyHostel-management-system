import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Mail, Phone, MapPin, User, GraduationCap, PhoneCall, Save, X, Edit3, Bed, Camera } from 'lucide-react';
import './StudentProfile.css';

const StudentProfile = () => {
  const { user, updateUser, loading: authLoading } = useContext(AuthContext);
  const [roomData, setRoomData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    faculty: '',
    academicYear: '',
    profilePicture: '',
    dob: '',
    gender: '',
    nic: '',
    homeAddress: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
      email: ''
    }
  });

  const navigate = useNavigate();

  const faculties = [
    'Faculty of Engineering',
    'Faculty of Science',
    'Faculty of Computing',
    'Faculty of Management',
    'Faculty of Humanities',
    'Faculty of Medicine'
  ];

  const academicYears = [
    'First Year (Level 100)',
    'Second Year (Level 200)',
    'Third Year (Level 300)',
    'Final Year (Level 400)',
    'Postgraduate'
  ];

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        faculty: user.faculty || faculties[0],
        academicYear: user.academicYear || academicYears[0],
        profilePicture: user.profilePicture || '',
        dob: user.dob || '',
        gender: user.gender || 'Male',
        nic: user.nic || '',
        homeAddress: user.homeAddress || '',
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          relationship: user.emergencyContact?.relationship || '',
          phone: user.emergencyContact?.phone || '',
          email: user.emergencyContact?.email || ''
        }
      });

      if (user.assignedRoomId) {
        api.get(`/rooms/${user.assignedRoomId}`)
          .then(res => setRoomData(res.data))
          .catch(err => console.error('Error fetching room:', err));
      }
    }
  }, [user, authLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Error updating profile');
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${user?.fullName}&background=FBD38D&color=744210&size=200`;

  if (authLoading) return <div className="loading">Loading...</div>;

  return (
    <div className="profile-page-container">
      <Sidebar role="student" />
      
      <main className="profile-main">
        <header className="profile-header animate-fade-in">
          <h2>Student Profile</h2>
          {!isEditing ? (
            <button className="btn-edit-toggle" onClick={() => setIsEditing(true)}>
              <Edit3 size={18} /> Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn-save-profile" onClick={handleSubmit}><Save size={18} /> Save Changes</button>
              <button className="btn-cancel-profile" onClick={() => setIsEditing(false)}><X size={18} /> Cancel</button>
            </div>
          )}
        </header>

        <div className="profile-content-grid">
          <div className="profile-top-row animate-fade-in delay-1">
            <div className="summary-card card hover-lift">
              <div className="summary-left">
                <div className={`p-image-container ${isEditing ? 'editing-image' : ''}`}>
                  <img src={formData.profilePicture || defaultAvatar} alt="Profile" />
                  {isEditing && (
                    <label className="upload-overlay">
                      <Camera size={24} />
                      <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                      <span>Change Photo</span>
                    </label>
                  )}
                </div>
              </div>
              <div className="summary-right">
                <span className="status-badge">ACTIVE RESIDENT</span>
                <h1 className="p-name">{formData.fullName}</h1>
                <p className="p-reg">Registration: <span>{user?.regNumber || 'HMS-2024-XXXX'}</span></p>
                
                <div className="contact-pills">
                  <div className="pill">
                    <Mail size={14} />
                    <span className="readonly-email">{formData.email}</span>
                  </div>
                  <div className="pill">
                    <Phone size={14} />
                    {isEditing ? (
                      <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
                    ) : (
                      <span>{formData.phoneNumber || 'Add Phone Number'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="room-assignment-card hover-lift">
              <div className="r-header">
                <h3>Room Assignment</h3>
                <Bed size={40} className="r-icon-bg" />
              </div>
              <div className="r-main">
                <span className="r-label">ROOM NUMBER</span>
                <h2 className="r-number">{roomData ? roomData.roomNumber : 'Not Assigned'}</h2>
                <div className="r-meta-row">
                   <div className="r-meta">
                      <span className="r-label">FLOOR</span>
                      <p>{roomData ? `Floor ${roomData.floor}` : '-'}</p>
                   </div>
                   <div className="r-meta">
                      <span className="r-label">TYPE</span>
                      <p>{roomData ? `${roomData.type} Standard` : '-'}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>

          <div className="profile-details-row animate-slide-up delay-2">
            <div className="details-col card">
              <div className="col-header">
                <User size={20} className="col-icon" />
                <h4>Personal Details</h4>
              </div>
              <div className="details-list">
                <div className="detail-item">
                  <span className="d-label">DATE OF BIRTH</span>
                  {isEditing ? (
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} />
                  ) : (
                    <p>{formData.dob || 'Not Set'}</p>
                  )}
                </div>
                <div className="detail-item">
                  <span className="d-label">GENDER</span>
                  {isEditing ? (
                    <select name="gender" value={formData.gender} onChange={handleChange} className="edit-select">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p>{formData.gender}</p>
                  )}
                </div>
                <div className="detail-item">
                  <span className="d-label">NIC NUMBER</span>
                  {isEditing ? (
                    <input name="nic" value={formData.nic} onChange={handleChange} placeholder="Identity Card No" />
                  ) : (
                    <p>{formData.nic || 'Not Set'}</p>
                  )}
                </div>
                <div className="detail-item">
                  <span className="d-label">HOME ADDRESS</span>
                  {isEditing ? (
                    <textarea name="homeAddress" value={formData.homeAddress} onChange={handleChange} className="edit-textarea" />
                  ) : (
                    <p>{formData.homeAddress || 'No Address Provided'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="details-col card">
              <div className="col-header">
                <GraduationCap size={20} className="col-icon" />
                <h4>Academic Information</h4>
              </div>
              <div className="details-list">
                <div className="detail-item">
                  <span className="d-label">FACULTY</span>
                  {isEditing ? (
                    <select name="faculty" value={formData.faculty} onChange={handleChange} className="edit-select">
                      {faculties.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  ) : (
                    <p>{formData.faculty}</p>
                  )}
                </div>
                <div className="detail-item">
                  <span className="d-label">ACADEMIC YEAR</span>
                  {isEditing ? (
                    <select name="academicYear" value={formData.academicYear} onChange={handleChange} className="edit-select">
                      {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  ) : (
                    <p>{formData.academicYear}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="details-col card">
              <div className="col-header">
                <PhoneCall size={20} className="col-icon" />
                <h4>Emergency Contact</h4>
              </div>
              <div className="emergency-box">
                {isEditing ? (
                  <div className="edit-emergency">
                    <input name="emergencyContact.name" placeholder="Contact Name" value={formData.emergencyContact.name} onChange={handleChange} />
                    <input name="emergencyContact.relationship" placeholder="Relationship" value={formData.emergencyContact.relationship} onChange={handleChange} />
                    <input name="emergencyContact.phone" placeholder="Phone" value={formData.emergencyContact.phone} onChange={handleChange} />
                    <input name="emergencyContact.email" placeholder="Email" value={formData.emergencyContact.email} onChange={handleChange} />
                  </div>
                ) : (
                  <>
                    <h5>{formData.emergencyContact.name || 'Not Provided'}</h5>
                    <span className="e-rel">Relationship: {formData.emergencyContact.relationship || '-'}</span>
                    <div className="e-contact">
                      <div className="e-item"><Phone size={14} /> {formData.emergencyContact.phone || '-'}</div>
                      <div className="e-item"><Mail size={14} /> {formData.emergencyContact.email || '-'}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;
