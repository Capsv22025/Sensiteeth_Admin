import { supabase } from '../services/supabaseClient';

// Fetch appointments (unchanged)
export const fetchAppointments = async () => {
  const { data, error } = await supabase
    .from('Appointment')
    .select(`
      *,
      Patient:patient_id (FirstName, LastName),
      Dentist:dentist_id (DentistName)
    `);
  if (error) throw error;
  console.log('Fetched appointments:', data);
  return data;
};

// Update appointment status (unchanged)
export const updateAppointmentStatus = async (id, status, rejectionReason = null) => {
  const updates = { Status: status };
  if (rejectionReason) updates.rejection_reason = rejectionReason;

  const { data, error } = await supabase
    .from('Appointment')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      Patient:patient_id (FirstName, LastName),
      Dentist:dentist_id (DentistName)
    `);
  if (error) throw error;
  console.log(`Updated appointment ${id} to status ${status}:`, data);
  return data[0];
};

// Fetch consultations (fixed foreign keys, removed Diagnosis join)
export const fetchConsultations = async () => {
  try {
    const { data, error } = await supabase
      .from('Consultation')
      .select(`
        *,
        Patient:PatientId (FirstName, LastName),
        Dentist:DentistId (DentistName)
      `)
      .order('AppointmentDate', { ascending: false });

    if (error) {
      console.error('Fetch consultations error:', error.message, error.details);
      throw new Error(`Failed to fetch consultations: ${error.message}`);
    }

    console.log('Fetched consultations:', data);
    return data;
  } catch (error) {
    console.error('fetchConsultations error:', error.message);
    throw error;
  }
};