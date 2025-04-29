// src/components/AdminDashboard.js
import React, { useState } from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
    console.log('Sidebar toggled, isSidebarCollapsed:', !isSidebarCollapsed);
  };

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar isSidebarCollapsed={isSidebarCollapsed} />
      <main className={`${styles.mainContent} ${isSidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={toggleSidebar} className={styles.toggleButton} aria-label="Toggle sidebar">
              <Bars3Icon className={styles.icon} />
            </button>
            <h1 className={styles.headerTitle}>Admin Dashboard</h1>
          </div>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;