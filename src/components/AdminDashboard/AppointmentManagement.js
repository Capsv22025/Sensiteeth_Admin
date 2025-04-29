import React, { useState, useEffect } from 'react';
import { fetchConsultations } from '../../services/appointmentService';
import { supabase } from '../../services/supabaseClient';
import Table from '../Shared/Table';
import Pagination from '../Shared/Pagination';
import styles from './AdminDashboard.module.css';

const AppointmentManagement = () => {
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStatusFor, setEditingStatusFor] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const consultationsPerPage = 5;

  useEffect(() => {
    const loadConsultations = async () => {
      setLoading(true);
      try {
        const data = await fetchConsultations();
        setConsultations(data);
        setFilteredConsultations(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching consultations:', error.message);
        setError(`Failed to load consultations: ${error.message}`);
        setLoading(false);
      }
    };
    loadConsultations();
  }, []);

  useEffect(() => {
    let filtered = consultations;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (consultation) => consultation.Status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((consultation) => {
        const fullName = `${consultation.Patient.FirstName} ${consultation.Patient.LastName}`.toLowerCase();
        return fullName.includes(searchLower);
      });
    }

    setFilteredConsultations(filtered);
    setCurrentPage(1);
  }, [statusFilter, searchTerm, consultations]);

  const handleChangeStatus = async (consultationId) => {
    if (!newStatus) return;

    try {
      await supabase
        .from('Consultation')
        .update({ Status: newStatus })
        .eq('id', consultationId)
        .select(`
          *,
          Patient:PatientId (FirstName, LastName),
          Dentist:DentistId (DentistName)
        `);

      const updatedConsultations = await fetchConsultations();
      setConsultations(updatedConsultations);
      setFilteredConsultations(updatedConsultations);
      setEditingStatusFor(null);
      setNewStatus('');
    } catch (error) {
      console.error('Change status error:', error.message);
      setError(`An error occurred: ${error.message}`);
    }
  };

  const formatDateTimePhilippine = (utcDateString) => {
    const utcDate = new Date(utcDateString);
    return utcDate.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const columns = [
    {
      header: 'Date',
      accessor: consultation => formatDateTimePhilippine(consultation.AppointmentDate),
    },
    {
      header: 'Patient',
      accessor: consultation => `${consultation.Patient.FirstName} ${consultation.Patient.LastName}`,
    },
    {
      header: 'Dentist',
      accessor: consultation => consultation.Dentist.DentistName,
    },
    {
      header: 'Status',
      accessor: 'Status',
    },
    {
      header: 'Actions',
      accessor: consultation => (
        <div className={styles.actions}>
          {editingStatusFor === consultation.id ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className={`${styles.formInput} ${styles.customSelect}`}
              >
                <option value="">Select Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="partially complete">Partially Complete</option>
                <option value="complete">Complete</option>
                <option value="follow-up">Follow-Up</option>
              </select>
              <button
                onClick={() => handleChangeStatus(consultation.id)}
                className={`${styles.submitButton} ${styles.saveButton}`}
                disabled={!newStatus}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingStatusFor(null);
                  setNewStatus('');
                }}
                className={`${styles.submitButton} ${styles.cancelButton}`}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className={`${styles.editButton} ${styles.changeStatusButton}`}
              onClick={() => setEditingStatusFor(consultation.id)}
            >
              Change Status
            </button>
          )}
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(filteredConsultations.length / consultationsPerPage);
  const startIndex = (currentPage - 1) * consultationsPerPage;
  const currentConsultations = filteredConsultations.slice(startIndex, startIndex + consultationsPerPage);

  if (loading) {
    return <div className={styles.userManagementContainer}>Loading consultations...</div>;
  }

  if (error) {
    return <div className={styles.userManagementContainer}>{error}</div>;
  }

  return (
    <div className={styles.userManagementContainer}>
      <h2 className={styles.userManagementTitle}>Consultation Management</h2>
      <div className={styles.filterWrapper}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            Filter by Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${styles.userManagementSelect} ${styles.customSelect}`}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="partially complete">Partially Complete</option>
              <option value="complete">Complete</option>
              <option value="follow-up">Follow-Up</option>
            </select>
          </label>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>
            Search by Patient Name
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter patient name..."
              className={`${styles.formInput} ${styles.customInput}`}
            />
          </label>
        </div>
      </div>
      {filteredConsultations.length === 0 ? (
        <p className={styles.userManagementNoData}>No consultations found.</p>
      ) : (
        <>
          <Table data={currentConsultations} columns={columns} />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentManagement;