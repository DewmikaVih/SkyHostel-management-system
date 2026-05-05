import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Layout, Bed, Wrench, Utensils, Users, Bell, LogOut, CreditCard, X, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ role = 'student' }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = role === 'student' ? [
    { name: 'Dashboard', icon: <Layout size={20} />, path: '/dashboard' },
    { name: 'Room Allocation', icon: <Bed size={20} />, path: '/allocation' },
    { name: 'Maintenance', icon: <Wrench size={20} />, path: '/maintenance' },
    { name: 'Canteen', icon: <Utensils size={20} />, path: '/canteen' },
    { name: 'Visitors', icon: <Users size={20} />, path: '/visitors' },
    { name: 'Notices', icon: <Bell size={20} />, path: '/notices' },
  ] : [
    { name: 'Dashboard', icon: <Layout size={20} />, path: '/admin/dashboard' },
    { name: 'Room Management', icon: <Bed size={20} />, path: '/admin/rooms' },
    { name: 'Maintenance', icon: <Wrench size={20} />, path: '/admin/maintenance' },
    { name: 'Visitors', icon: <Users size={20} />, path: '/admin/visitors' },
    { name: 'Canteen', icon: <Utensils size={20} />, path: '/admin/canteen' },
    { name: 'Notices', icon: <Bell size={20} />, path: '/admin/notices' },
    { name: 'Fines', icon: <CreditCard size={20} />, path: '/admin/fines' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-box">
            <Layout size={24} color="white" />
          </div>
          <div>
            <h3>SkyHostel</h3>
            <span>{role.toUpperCase()} PORTAL</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, idx) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} animate-fade-in`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={() => setShowModal(true)}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {showModal && (
        <div className="logout-modal-overlay">
          <div className="logout-modal animate-slide-up">
            <div className="logout-modal-content">
              <div className="logout-icon-circle">
                <AlertCircle size={32} color="#E63946" />
              </div>
              <h3>Are you sure to logout?</h3>
              <p>You will be returned to the login screen.</p>
              <div className="logout-modal-actions">
                <button className="btn-confirm-logout" onClick={handleLogout}>OK</button>
                <button className="btn-cancel-logout" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
