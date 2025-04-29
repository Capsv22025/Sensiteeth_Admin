import React, { useState, useEffect, useRef } from 'react';
import { fetchConsultations } from '../../services/appointmentService';
import { supabase } from '../../services/supabaseClient';
import { UsersIcon, UserIcon } from '@heroicons/react/24/outline';
import styles from './AdminDashboard.module.css';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalConsultations: 0,
    pendingConsultations: 0,
    approvedConsultations: 0,
    rejectedConsultations: 0,
    completedConsultations: 0,
    totalPatients: 0,
    totalDentists: 0,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch consultations
        const consultations = await fetchConsultations();

        // Calculate consultation metrics
        const totalConsultations = consultations.length;
        const pendingConsultations = consultations.filter(c => c.Status.toLowerCase() === 'pending').length;
        const approvedConsultations = consultations.filter(c => c.Status.toLowerCase() === 'approved').length;
        const rejectedConsultations = consultations.filter(c => c.Status.toLowerCase() === 'rejected').length;
        const completedConsultations = consultations.filter(c => c.Status.toLowerCase() === 'complete').length;

        // Fetch total patients
        const { count: totalPatients, error: patientsError } = await supabase
          .from('Patient')
          .select('*', { count: 'exact', head: true });
        if (patientsError) throw patientsError;

        // Fetch total dentists
        const { count: totalDentists, error: dentistsError } = await supabase
          .from('Dentist')
          .select('*', { count: 'exact', head: true });
        if (dentistsError) throw dentistsError;

        // Update metrics
        setMetrics({
          totalConsultations,
          pendingConsultations,
          approvedConsultations,
          rejectedConsultations,
          completedConsultations,
          totalPatients: totalPatients || 0,
          totalDentists: totalDentists || 0,
        });

        // Prepare chart data (consultations by month)
        const monthlyData = Array(12).fill(0); // Array for 12 months
        consultations.forEach(consultation => {
          const date = new Date(consultation.AppointmentDate);
          const month = date.getMonth(); // 0-11 (Jan-Dec)
          monthlyData[month]++;
        });

        // Initialize Chart.js
        if (chartRef.current) {
          // Destroy previous chart instance if it exists
          if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
          }

          const ctx = chartRef.current.getContext('2d');
          chartInstanceRef.current = new window.Chart(ctx, {
            type: 'line',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              datasets: [{
                label: 'Consultations',
                data: monthlyData,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
              }],
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'Consultations Trend (2025)',
                  font: {
                    size: 16,
                    family: "'Inter', 'Poppins', sans-serif",
                  },
                  color: '#1f2937',
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Month',
                    color: '#1f2937',
                  },
                },
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Number of Consultations',
                    color: '#1f2937',
                  },
                  ticks: {
                    stepSize: 1,
                  },
                },
              },
            },
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error.message);
        setError(`Failed to load dashboard data: ${error.message}`);
        setLoading(false);
      }
    };

    // Load Chart.js dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => loadDashboardData();
    document.body.appendChild(script);

    return () => {
      // Cleanup chart instance on unmount
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return <div className={styles.userManagementContainer}>Loading dashboard...</div>;
  }

  if (error) {
    return <div className={styles.userManagementContainer}>{error}</div>;
  }

  return (
    <div className={styles.userManagementContainer}>
      <h2 className={styles.userManagementTitle}>Dashboard</h2>
      <div className={styles.metricsContainer}>
        <div className={styles.metricCard}>
          <h3>Total Consultations</h3>
          <p>{metrics.totalConsultations}</p>
        </div>
        <div className={styles.metricCard}>
          <h3>Pending Consultations</h3>
          <p>{metrics.pendingConsultations}</p>
        </div>
        <div className={styles.metricCard}>
          <h3>Approved Consultations</h3>
          <p>{metrics.approvedConsultations}</p>
        </div>
        <div className={styles.metricCard}>
          <h3>Rejected Consultations</h3>
          <p>{metrics.rejectedConsultations}</p>
        </div>
        <div className={styles.metricCard}>
          <h3>Completed Consultations</h3>
          <p>{metrics.completedConsultations}</p>
        </div>
      </div>
      <div className={styles.entityMetricsContainer}>
        <div className={styles.entityCard}>
          <UsersIcon className={styles.entityIcon} />
          <div className={styles.entityText}>
            <h3>Total Dentists</h3>
            <p>{metrics.totalDentists}</p>
          </div>
        </div>
        <div className={styles.entityCard}>
          <UserIcon className={styles.entityIcon} />
          <div className={styles.entityText}>
            <h3>Total Patients</h3>
            <p>{metrics.totalPatients}</p>
          </div>
        </div>
      </div>
      <div className={styles.chartContainer}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default Dashboard;