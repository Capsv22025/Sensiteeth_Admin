import React, { useState, useEffect, useMemo } from 'react';
import { fetchPatients, addUser, updateUser, deleteUser } from '../../services/userService';
import Table from '../Shared/Table';
import Modal from '../Shared/Modal';
import Pagination from '../Shared/Pagination';
import styles from './AdminDashboard.module.css';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const patientsPerPage = 5;

  // Fetch patients
  useEffect(() => {
    const loadPatients = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPatients();
        setPatients(data || []);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error fetching patients:', error);
        alert('Failed to fetch patients');
      } finally {
        setIsLoading(false);
      }
    };
    loadPatients();
  }, []);

  const handleAddPatient = async (patientData) => {
    try {
      const newPatientData = { ...patientData, role: 'patient' };
      const newPatient = await addUser(newPatientData);
      setPatients([newPatient, ...patients]);
      setIsModalOpen(false);
      setError('');
      alert('Patient added successfully!');
    } catch (error) {
      console.error('Error adding patient:', error);
      setError(`Failed to add patient: ${error.message}`);
    }
  };

  const handleEditPatient = async (patientData) => {
    try {
      const updatedPatientData = {
        FirstName: patientData.FirstName,
        MiddleName: patientData.MiddleName || null,
        LastName: patientData.LastName,
        Email: patientData.Email,
        Age: patientData.Age,
        BirthDate: patientData.BirthDate || null,
        Gender: patientData.Gender || null,
        ContactNo: patientData.ContactNo || null,
        role: 'patient',
        oldEmail: selectedPatient.Email, // Include old email for Users table sync
      };
      console.log('Updating patient with ID:', selectedPatient.id, 'Data:', updatedPatientData);
      const updatedPatient = await updateUser(selectedPatient.id, updatedPatientData);
      setPatients(patients.map(patient => (patient.id === updatedPatient.id ? updatedPatient : patient)));
      setIsModalOpen(false);
      setSelectedPatient(null);
      setError('');
      alert('Patient updated successfully!');
    } catch (error) {
      console.error('Error updating patient:', error.message, 'Details:', error);
      setError(`Failed to update patient: ${error.message}`);
    }
  };

  const handleDeletePatient = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deleteUser(id, 'patient');
        setPatients(patients.filter(patient => patient.id !== id));
        alert('Patient deleted successfully!');
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert(`Failed to delete patient: ${error.message}`);
      }
    }
  };

  const patientColumns = [
    { header: 'Name', accessor: patient => `${patient.FirstName} ${patient.LastName}` },
    { header: 'Email', accessor: 'Email' },
    { header: 'Role', accessor: () => 'Patient' },
    {
      header: 'Actions',
      accessor: patient => (
        <div className={styles.actions}>
          <button
            onClick={() => { setSelectedPatient(patient); setIsModalOpen(true); }}
            className={styles.editButton}
          >
            Edit
          </button>
          <button
            onClick={() => handleDeletePatient(patient.id)}
            className={styles.deleteButton}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(patients.length / patientsPerPage);
  const currentPatients = useMemo(() => {
    const startIndex = (currentPage - 1) * patientsPerPage;
    return patients.slice(startIndex, startIndex + patientsPerPage);
  }, [patients, currentPage]);

  return (
    <div className={styles.userManagementContainer}>
      <h2 className={styles.userManagementTitle}>Patient Management</h2>
      <div className={styles.userManagementFilterContainer}>
        <button
          onClick={() => { setSelectedPatient(null); setIsModalOpen(true); }}
          className={styles.userManagementAddButton}
        >
          Add Patient
        </button>
      </div>
      {isLoading ? (
        <p className={styles.userManagementLoading}>Loading...</p>
      ) : patients.length === 0 ? (
        <p className={styles.userManagementNoData}>
          No patients found.
        </p>
      ) : (
        <>
          <Table
            data={currentPatients}
            columns={patientColumns}
          />
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
      {isModalOpen && (
        <Modal
          onClose={() => { setIsModalOpen(false); setSelectedPatient(null); setError(''); }}
        >
          <h3 className={styles.modalTitle}>
            {selectedPatient ? 'Edit' : 'Add'} Patient
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const patientData = {
                FirstName: formData.get('FirstName'),
                MiddleName: formData.get('MiddleName'),
                LastName: formData.get('LastName'),
                Email: formData.get('Email'),
                Age: parseInt(formData.get('Age')) || null,
                BirthDate: formData.get('BirthDate'),
                Gender: formData.get('Gender'),
                ContactNo: formData.get('ContactNo') || null,
              };
              selectedPatient ? handleEditPatient(patientData) : handleAddPatient(patientData);
            }}
            className={styles.modalFormPatient}
          >
            <div className={styles.formRow}>
              <label className={styles.formLabel}>
                First Name:
                <input
                  type="text"
                  name="FirstName"
                  defaultValue={selectedPatient?.FirstName || ''}
                  required
                  className={styles.formInput}
                />
              </label>
              <label className={styles.formLabel}>
                Middle Name:
                <input
                  type="text"
                  name="MiddleName"
                  defaultValue={selectedPatient?.MiddleName || ''}
                  className={styles.formInput}
                />
              </label>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>
                Last Name:
                <input
                  type="text"
                  name="LastName"
                  defaultValue={selectedPatient?.LastName || ''}
                  required
                  className={styles.formInput}
                />
              </label>
              <label className={styles.formLabel}>
                Email:
                <input
                  type="email"
                  name="Email"
                  defaultValue={selectedPatient?.Email || ''}
                  required
                  className={styles.formInput}
                />
              </label>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>
                Age:
                <input
                  type="number"
                  name="Age"
                  defaultValue={selectedPatient?.Age || ''}
                  className={styles.formInput}
                />
              </label>
              <label className={styles.formLabel}>
                Birth Date:
                <input
                  type="date"
                  name="BirthDate"
                  defaultValue={selectedPatient?.BirthDate || ''}
                  className={styles.formInput}
                />
              </label>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>
                Gender:
                <select
                  name="Gender"
                  defaultValue={selectedPatient?.Gender || ''}
                  className={styles.formInput}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className={styles.formLabel}>
                Contact No:
                <input
                  type="tel"
                  name="ContactNo"
                  defaultValue={selectedPatient?.ContactNo || ''}
                  className={styles.formInput}
                />
              </label>
            </div>
            {error && (
              <p className={styles.passwordError}>{error}</p>
            )}
            <button type="submit" className={styles.submitButton}>
              {selectedPatient ? 'Update' : 'Add'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PatientManagement;