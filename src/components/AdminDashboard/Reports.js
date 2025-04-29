// src/components/AdminDashboard/Reports.js
import React, { useState, useEffect } from 'react';
import { fetchAppointmentStats } from '../../services/reportService';
import Table from '../Shared/Table';

const Reports = () => {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchAppointmentStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    loadStats();
  }, []);

  const columns = [
    { header: 'Dentist', accessor: 'dentist' },
    { header: 'Total Appointments', accessor: 'total' },
    { header: 'Approved', accessor: 'approved' },
    { header: 'Pending', accessor: 'pending' },
    { header: 'Rejected', accessor: 'rejected' },
  ];

  return (
    <div>
      <h2>Reports</h2>
      <Table data={stats} columns={columns} />
    </div>
  );
};

export default Reports;