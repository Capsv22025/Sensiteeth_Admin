// src/components/AdminDashboard/AvailabilityManagement.js
import React, { useState, useEffect } from 'react';
import { fetchAvailability, updateAvailability, fetchDentists } from '../../services/availabilityService';
import Table from '../Shared/Table';
import Modal from '../Shared/Modal';
import Pagination from '../Shared/Pagination';

const AvailabilityManagement = () => {
  const [availability, setAvailability] = useState([]);
  const [dentists, setDentists] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const availabilityPerPage = 5;

  useEffect(() => {
    const loadData = async () => {
      try {
        const availData = await fetchAvailability();
        const dentistData = await fetchDentists();
        setAvailability(availData);
        setDentists(dentistData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    loadData();
  }, []);

  const handleUpdateAvailability = async (data) => {
    try {
      const updated = await updateAvailability(data.DentistId, data.Date, data.IsAvailable);
      setAvailability(
        availability.some(a => a.DentistId === data.DentistId && a.Date === data.Date)
          ? availability.map(a => (a.DentistId === data.DentistId && a.Date === data.Date ? updated : a))
          : [updated, ...availability]
      );
      setIsModalOpen(false);
      setSelectedAvailability(null);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability');
    }
  };

  const columns = [
    { header: 'Dentist', accessor: 'Dentist.DentistName' },
    { header: 'Date', accessor: 'Date' },
    { header: 'Available', accessor: a => (a.IsAvailable ? 'Yes' : 'No') },
    {
      header: 'Actions',
      accessor: a => (
        <button onClick={() => { setSelectedAvailability(a); setIsModalOpen(true); }}>Edit</button>
      ),
    },
  ];

  const totalPages = Math.ceil(availability.length / availabilityPerPage);
  const startIndex = (currentPage - 1) * availabilityPerPage;
  const currentAvailability = availability.slice(startIndex, startIndex + availabilityPerPage);

  return (
    <div>
      <h2>Availability Management</h2>
      <button onClick={() => { setSelectedAvailability(null); setIsModalOpen(true); }} style={{ marginBottom: '1rem' }}>
        Add Availability
      </button>
      <Table data={currentAvailability} columns={columns} />
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
      {isModalOpen && (
        <Modal onClose={() => { setIsModalOpen(false); setSelectedAvailability(null); }}>
          <h3>{selectedAvailability ? 'Edit Availability' : 'Add Availability'}</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const availabilityData = {
              DentistId: parseInt(formData.get('DentistId')),
              Date: formData.get('Date'),
              IsAvailable: formData.get('IsAvailable') === 'true',
            };
            handleUpdateAvailability(availabilityData);
          }}>
            <label>
              Dentist:
              <select name="DentistId" defaultValue={selectedAvailability?.DentistId || ''} required>
                <option value="" disabled>Select a dentist</option>
                {dentists.map(dentist => (
                  <option key={dentist.id} value={dentist.id}>{dentist.DentistName}</option>
                ))}
              </select>
            </label>
            <label>
              Date:
              <input
                type="date"
                name="Date"
                defaultValue={selectedAvailability?.Date || ''}
                required
              />
            </label>
            <label>
              Available:
              <select name="IsAvailable" defaultValue={selectedAvailability?.IsAvailable || 'true'} required>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </label>
            <button type="submit">{selectedAvailability ? 'Update' : 'Add'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AvailabilityManagement;