// src/pages/AdminPage.js
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AdminDashboard from '../components/AdminDashboard/AdminDashboard';

const AdminPage = () => {
  const { signOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div>
      <button onClick={handleSignOut} style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        Sign Out
      </button>
      <AdminDashboard />
    </div>
  );
};

export default AdminPage;