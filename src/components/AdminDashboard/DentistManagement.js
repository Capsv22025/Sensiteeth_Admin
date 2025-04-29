// src/components/DentistManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import { fetchDentists, addUser, addSecretary, updateUser, deleteUser } from '../../services/userService';
import Table from '../Shared/Table';
import Modal from '../Shared/Modal';
import Pagination from '../Shared/Pagination';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../services/supabaseClient';
import styles from './AdminDashboard.module.css';

const DentistManagement = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSecretaryModalOpen, setIsSecretaryModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSecretary, setSelectedSecretary] = useState(null);
  const [selectedDentistId, setSelectedDentistId] = useState(null);
  const [expandedDentistId, setExpandedDentistId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSecretaryLoading, setIsSecretaryLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const usersPerPage = 5;

  // Fetch dentists
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const data = await fetchDentists();
        setUsers(data || []);
        setCurrentPage(1);
      } catch (error) {
        console.error('Error fetching dentists:', error);
        alert('Failed to fetch dentists');
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleAddUser = async (userData) => {
    try {
      const newUserData = { ...userData, role: 'dentist' };
      const newUser = await addUser(newUserData);
      newUser.secretaries = [];
      setUsers([newUser, ...users]);
      setIsModalOpen(false);
      setPasswordError('');
      alert('Dentist added successfully!');
    } catch (error) {
      console.error('Error adding dentist:', error);
      setPasswordError(`Failed to add dentist: ${error.message}`);
    }
  };

  const handleEditUser = async (userData) => {
    try {
      const updatedUserData = {
        ...selectedUser,
        Email: userData.Email,
        role: 'dentist',
      };
      const updatedUser = await updateUser(selectedUser.id, updatedUserData);
      updatedUser.secretaries = selectedUser.secretaries || [];
      setUsers(users.map(user => (user.id === updatedUser.id ? updatedUser : user)));
      setIsModalOpen(false);
      setSelectedUser(null);
      setPasswordError('');
      alert('Dentist updated successfully!');
    } catch (error) {
      console.error('Error updating dentist:', error);
      setPasswordError(`Failed to update dentist: ${error.message}`);
    }
  };

  const handleAddSecretary = async (secretaryData) => {
    setIsSecretaryLoading(true);
    try {
      const { email, name, Password: password, ConfirmPassword: confirmPassword } = secretaryData;
      if (!email || !name || !password || !confirmPassword) {
        setPasswordError('Please fill in all required fields: Name, Email, Password, and Confirm Password.');
        setIsSecretaryLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        setIsSecretaryLoading(false);
        return;
      }
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters.');
        setIsSecretaryLoading(false);
        return;
      }
      const newSecretary = await addSecretary({ email, password, name, dentistId: selectedDentistId });
      setUsers(users.map(dentist => {
        if (dentist.id === selectedDentistId) {
          return {
            ...dentist,
            secretaries: [...(dentist.secretaries || []), newSecretary],
          };
        }
        return dentist;
      }));
      setIsSecretaryModalOpen(false);
      setSelectedDentistId(null);
      setPasswordError('');
      alert('Secretary account created successfully! They must confirm their email to log in.');
    } catch (error) {
      console.error('Error adding secretary:', error);
      setPasswordError(`Failed to add secretary: ${error.message}`);
    } finally {
      setIsSecretaryLoading(false);
    }
  };

  const handleEditSecretary = async (secretaryData) => {
    setIsSecretaryLoading(true);
    try {
      const { email, name } = secretaryData;
      if (!email || !name) {
        setPasswordError('Please fill in all required fields: Name and Email.');
        setIsSecretaryLoading(false);
        return;
      }
      const updatedSecretaryData = {
        ...selectedSecretary,
        name,
        email,
        role: 'secretary',
        dentist_id: selectedSecretary.dentist_id,
      };
      const updatedSecretary = await updateUser(selectedSecretary.id, updatedSecretaryData);
      setUsers(users.map(dentist => {
        if (dentist.id === selectedSecretary.dentist_id) {
          return {
            ...dentist,
            secretaries: dentist.secretaries.map(sec =>
              sec.id === updatedSecretary.id ? updatedSecretary : sec
            ),
          };
        }
        return dentist;
      }));
      setIsSecretaryModalOpen(false);
      setSelectedSecretary(null);
      setPasswordError('');
      alert('Secretary updated successfully!');
    } catch (error) {
      console.error('Error updating secretary:', error);
      setPasswordError(`Failed to update secretary: ${error.message}`);
    } finally {
      setIsSecretaryLoading(false);
    }
  };

  const handlePasswordReset = async (email) => {
    if (window.confirm(`Send a password reset email to ${email}?`)) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
        });
        if (error) throw error;
        alert('Password reset email sent successfully!');
      } catch (error) {
        console.error('Error sending password reset:', error);
        alert(`Failed to send password reset: ${error.message}`);
      }
    }
  };

  const handleDeleteUser = async (id, role, dentistId = null) => {
    if (window.confirm(`Are you sure you want to delete this ${role}?`)) {
      try {
        await deleteUser(id, role);
        if (role === 'dentist') {
          setUsers(users.filter(user => user.id !== id));
        } else if (role === 'secretary') {
          setUsers(users.map(dentist => {
            if (dentist.id === dentistId) {
              return {
                ...dentist,
                secretaries: (dentist.secretaries || []).filter(secretary => secretary.id !== id),
              };
            }
            return dentist;
          }));
        }
        alert(`${role.charAt(0).toUpperCase() + role.slice(1)} deleted successfully!`);
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Failed to delete ${role}: ${error.message}`);
      }
    }
  };

  const toggleDentistExpansion = (dentistId) => {
    setExpandedDentistId(expandedDentistId === dentistId ? null : dentistId);
  };

  const dentistColumns = [
    {
      header: 'Name',
      accessor: dentist => (
        <div className={styles.dentistName}>
          <button
            onClick={() => toggleDentistExpansion(dentist.id)}
            className={styles.expandButton}
            aria-label={expandedDentistId === dentist.id ? 'Collapse secretaries' : 'Expand secretaries'}
          >
            {expandedDentistId === dentist.id ? (
              <ChevronUpIcon className={styles.icon} />
            ) : (
              <ChevronDownIcon className={styles.icon} />
            )}
          </button>
          {dentist.DentistName}
        </div>
      ),
    },
    { header: 'Email', accessor: 'Email' },
    { header: 'Role', accessor: () => 'Dentist' },
    {
      header: 'Actions',
      accessor: dentist => (
        <div className={styles.actions}>
          <button
            onClick={() => { setSelectedUser({ ...dentist, role: 'dentist' }); setIsModalOpen(true); }}
            className={styles.editButton}
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteUser(dentist.id, 'dentist')}
            className={styles.deleteButton}
          >
            Delete
          </button>
          <button
            onClick={() => { setSelectedDentistId(dentist.id); setIsSecretaryModalOpen(true); }}
            className={styles.addSecretaryButton}
          >
            Add Secretary
          </button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil(users.length / usersPerPage);
  const currentUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return users.slice(startIndex, startIndex + usersPerPage);
  }, [users, currentPage]);

  return (
    <div className={styles.userManagementContainer}>
      <h2 className={styles.userManagementTitle}>Dentist Management</h2>
      <div className={styles.userManagementFilterContainer}>
        <button
          onClick={() => { setSelectedUser(null); setIsModalOpen(true); }}
          className={styles.userManagementAddButton}
        >
          Add Dentist
        </button>
      </div>
      {isLoading ? (
        <p className={styles.userManagementLoading}>Loading...</p>
      ) : users.length === 0 ? (
        <p className={styles.userManagementNoData}>
          No dentists found.
        </p>
      ) : (
        <>
          <Table
            data={currentUsers}
            columns={dentistColumns}
            renderRowExpansion={(dentist) => (
              <div
                className={styles.secretariesContainer}
                style={{ display: expandedDentistId === dentist.id ? 'block' : 'none' }}
              >
                <h4 className={styles.secretariesTitle}>Secretaries</h4>
                {(dentist.secretaries && dentist.secretaries.length > 0) ? (
                  <div className={styles.secretaryList}>
                    {dentist.secretaries.map(secretary => (
                      <div key={secretary.id} className={styles.secretaryCard}>
                        <div className={styles.secretaryInfo}>
                          <h5 className={styles.secretaryName}>
                            {secretary.name || 'Unnamed Secretary'}
                          </h5>
                          <p className={styles.secretaryDetail}>
                            Email: {secretary.email || 'N/A'}
                          </p>
                        </div>
                        <div className={styles.secretaryActions}>
                          <button
                            onClick={() => {
                              setSelectedSecretary({ ...secretary, dentist_id: dentist.id });
                              setSelectedDentistId(dentist.id);
                              setIsSecretaryModalOpen(true);
                            }}
                            className={styles.editButton}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(secretary.id, 'secretary', dentist.id)}
                            className={styles.deleteButton}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handlePasswordReset(secretary.email)}
                            className={styles.resetButton}
                          >
                            Reset Password
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noSecretaries}>No secretaries assigned.</p>
                )}
              </div>
            )}
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
          onClose={() => { setIsModalOpen(false); setSelectedUser(null); setPasswordError(''); }}
        >
          <h3 className={styles.modalTitle}>
            {selectedUser ? 'Edit' : 'Add'} Dentist
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const password = formData.get('Password');
              const confirmPassword = formData.get('ConfirmPassword');
              if (!selectedUser && (!password || !confirmPassword)) {
                setPasswordError('Password and Confirm Password are required.');
                return;
              }
              if (!selectedUser && password !== confirmPassword) {
                setPasswordError('Passwords do not match');
                return;
              }
              if (!selectedUser && password.length < 6) {
                setPasswordError('Password must be at least 6 characters.');
                return;
              }
              const userData = {
                Email: formData.get('Email'),
                Password: password || undefined,
              };
              selectedUser ? handleEditUser(userData) : handleAddUser(userData);
            }}
            className={styles.modalForm}
          >
            <label className={styles.formLabel}>
              Email:
              <input
                type="email"
                name="Email"
                defaultValue={selectedUser?.Email || ''}
                required
                className={styles.formInput}
              />
            </label>
            {!selectedUser && (
              <>
                <label className={styles.formLabel}>
                  Password:
                  <input
                    type="password"
                    name="Password"
                    required
                    minLength="6"
                    className={styles.formInput}
                  />
                </label>
                <label className={styles.formLabel}>
                  Confirm Password:
                  <input
                    type="password"
                    name="ConfirmPassword"
                    required
                    minLength="6"
                    className={styles.formInput}
                  />
                </label>
              </>
            )}
            {passwordError && (
              <p className={styles.passwordError}>{passwordError}</p>
            )}
            <button type="submit" className={styles.submitButton}>
              {selectedUser ? 'Update' : 'Add'}
            </button>
          </form>
        </Modal>
      )}
      {isSecretaryModalOpen && (
        <Modal
          onClose={() => { setIsSecretaryModalOpen(false); setSelectedSecretary(null); setSelectedDentistId(null); setPasswordError(''); }}
        >
          <h3 className={styles.modalTitle}>
            {selectedSecretary ? 'Edit' : 'Add'} Secretary
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const secretaryData = {
                name: formData.get('name'),
                email: formData.get('email'),
                ...(selectedSecretary ? {} : {
                  Password: formData.get('Password'),
                  ConfirmPassword: formData.get('ConfirmPassword'),
                }),
              };
              selectedSecretary ? handleEditSecretary(secretaryData) : handleAddSecretary(secretaryData);
            }}
            className={styles.modalForm}
          >
            {!selectedSecretary && (
              <label className={styles.formLabel}>
                Assign to Dentist:
                <select
                  name="dentistId"
                  value={selectedDentistId || ''}
                  onChange={(e) => setSelectedDentistId(e.target.value)}
                  required
                  className={styles.formInput}
                >
                  <option value="">Select Dentist</option>
                  {users.map(dentist => (
                    <option key={dentist.id} value={dentist.id}>
                      {dentist.DentistName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className={styles.formLabel}>
              Name:
              <input
                type="text"
                name="name"
                defaultValue={selectedSecretary?.name || ''}
                required
                className={styles.formInput}
              />
            </label>
            <label className={styles.formLabel}>
              Email:
              <input
                type="email"
                name="email"
                defaultValue={selectedSecretary?.email || ''}
                required
                className={styles.formInput}
              />
            </label>
            {!selectedSecretary && (
              <>
                <label className={styles.formLabel}>
                  Password:
                  <input
                    type="password"
                    name="Password"
                    required
                    minLength="6"
                    className={styles.formInput}
                  />
                </label>
                <label className={styles.formLabel}>
                  Confirm Password:
                  <input
                    type="password"
                    name="ConfirmPassword"
                    required
                    minLength="6"
                    className={styles.formInput}
                  />
                </label>
              </>
            )}
            {passwordError && (
              <p className={styles.passwordError}>{passwordError}</p>
            )}
            <button type="submit" className={styles.submitButton} disabled={isSecretaryLoading}>
              {isSecretaryLoading ? 'Processing...' : selectedSecretary ? 'Update' : 'Add'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DentistManagement;