import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RegisterStudent from './pages/RegisterStudent';
import RegisterAdmin from './pages/RegisterAdmin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import AllocationHub from './pages/AllocationHub';
import Maintenance from './pages/Maintenance';
import Canteen from './pages/Canteen';
import Visitors from './pages/Visitors';
import Notices from './pages/Notices';
import AdminDashboard from './pages/AdminDashboard';
import AdminRooms from './pages/AdminRooms';
import AdminMaintenance from './pages/AdminMaintenance';
import AdminVisitors from './pages/AdminVisitors';
import AdminCanteen from './pages/AdminCanteen';
import AdminNotices from './pages/AdminNotices';
import AdminFines from './pages/AdminFines';
import AdminProfile from './pages/AdminProfile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RegisterStudent />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Student Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
        <Route path="/allocation" element={<ProtectedRoute><AllocationHub /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
        <Route path="/canteen" element={<ProtectedRoute><Canteen /></ProtectedRoute>} />
        <Route path="/visitors" element={<ProtectedRoute><Visitors /></ProtectedRoute>} />
        <Route path="/notices" element={<ProtectedRoute><Notices /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute adminOnly><AdminProfile /></ProtectedRoute>} />
        <Route path="/admin/rooms" element={<ProtectedRoute adminOnly><AdminRooms /></ProtectedRoute>} />
        <Route path="/admin/maintenance" element={<ProtectedRoute adminOnly><AdminMaintenance /></ProtectedRoute>} />
        <Route path="/admin/visitors" element={<ProtectedRoute adminOnly><AdminVisitors /></ProtectedRoute>} />
        <Route path="/admin/canteen" element={<ProtectedRoute adminOnly><AdminCanteen /></ProtectedRoute>} />
        <Route path="/admin/notices" element={<ProtectedRoute adminOnly><AdminNotices /></ProtectedRoute>} />
        <Route path="/admin/fines" element={<ProtectedRoute adminOnly><AdminFines /></ProtectedRoute>} />
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
