// src/services/availabilityService.js
import { supabase } from './supabaseClient';

export const fetchAvailability = async () => {
  const { data, error } = await supabase
    .from('Dentist_Availability')
    .select('*, Dentist:Dentist!DentistId(DentistName)')
    .order('Date', { ascending: true });
  if (error) throw error;
  return data;
};

export const updateAvailability = async (dentistId, date, isAvailable) => {
  const { data, error } = await supabase
    .from('Dentist_Availability')
    .upsert({ DentistId: dentistId, Date: date, IsAvailable: isAvailable }, { onConflict: ['DentistId', 'Date'] })
    .select();
  if (error) throw error;
  return data[0];
};

export const fetchDentists = async () => {
  const { data, error } = await supabase
    .from('Dentist')
    .select('id, DentistName');
  if (error) throw error;
  return data;
};