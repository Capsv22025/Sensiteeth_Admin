// src/services/reportService.js
import { supabase } from './supabaseClient';

export const fetchAppointmentStats = async () => {
  const { data: appointments, error } = await supabase
    .from('Consultation')
    .select('DentistId, Status, Dentist:Dentist!DentistId(DentistName)')
    .order('DentistId');
  if (error) throw error;

  const stats = {};
  appointments.forEach(appt => {
    const dentist = appt.Dentist?.DentistName || 'Unknown';
    if (!stats[dentist]) {
      stats[dentist] = { total: 0, approved: 0, pending: 0, rejected: 0 };
    }
    stats[dentist].total += 1;
    if (appt.Status === 'approved') stats[dentist].approved += 1;
    if (appt.Status === 'pending') stats[dentist].pending += 1;
    if (appt.Status === 'rejected') stats[dentist].rejected += 1;
  });

  return Object.entries(stats).map(([dentist, data]) => ({
    dentist,
    ...data,
  }));
};