import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UsersIcon, CalendarIcon, ChartBarIcon, UserIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../../context/AuthContext';
import styles from './AdminDashboard.module.css';

const Sidebar = ({ isSidebarCollapsed }) => {
  const { signOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { to: '/admin/dentist-management', label: 'Dentist Management', icon: UsersIcon },
    { to: '/admin/patient-management', label: 'Patient Management', icon: UserIcon },
    { to: '/admin/appointment-management', label: 'Appointment Management', icon: CalendarIcon },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>Sensiteeth Admin</h2>
      </div>
      <div className={styles.sidebarContent}>
        <nav className={styles.sidebarNav}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `${styles.sidebarLink} ${isActive ? styles.activeLink : ''}`}
            >
              <item.icon className={styles.navIcon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className={styles.signOutButton}
        >
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;