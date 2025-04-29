import { supabase } from './supabaseClient';

// Fetch patients (unchanged)
export const fetchPatients = async () => {
  const { data, error } = await supabase
    .from('Patient')
    .select('*');
  if (error) throw error;
  console.log('Fetched patients:', data);
  return data;
};

// Fetch dentists (unchanged)
export const fetchDentists = async () => {
  const { data: dentists, error: dentistError } = await supabase
    .from('Dentist')
    .select('*');
  if (dentistError) throw dentistError;

  const { data: secretaries, error: secretaryError } = await supabase
    .from('secretary')
    .select('*');
  if (secretaryError) throw secretaryError;

  const dentistsWithSecretaries = dentists.map(dentist => ({
    ...dentist,
    secretaries: (secretaries || [])
      .filter(secretary => secretary.dentist_id === dentist.id)
      .map(secretary => ({
        ...secretary,
        id: secretary.id || `temp-${Math.random()}`,
        name: secretary.name || 'Unnamed Secretary',
        email: secretary.email || 'N/A',
        contactNo: secretary.contactNo || null,
      })),
  }));

  console.log('Fetched dentists with secretaries:', dentistsWithSecretaries);
  return dentistsWithSecretaries;
};

// Add user (modified to handle Users table for patients)
export const addUser = async (userData) => {
  let data, error;
  
  // Insert into Users table for all roles
  const userEntry = { email: userData.Email || userData.email, role: userData.role };
  const { error: userInsertError } = await supabase
    .from('Users')
    .insert([userEntry]);
  if (userInsertError) throw new Error(`Users table insert failed: ${userInsertError.message}`);

  if (userData.role === 'patient') {
    ({ data, error } = await supabase
      .from('Patient')
      .insert([userData])
      .select());
  } else if (userData.role === 'dentist') {
    ({ data, error } = await supabase
      .from('Dentist')
      .insert([userData])
      .select());
  } else if (userData.role === 'secretary') {
    ({ data, error } = await supabase
      .from('secretary')
      .insert([userData])
      .select());
  }
  if (error) throw error;
  console.log(`Added ${userData.role}:`, data);
  return data[0];
};

// Update user (modified to sync email with Users table)
export const updateUser = async (id, userData) => {
  let data, error;

  // If email is being updated, sync with Users table
  if (userData.Email || userData.email) {
    const emailField = userData.Email || userData.email;
    // Find the corresponding Users entry by matching email and role
    const { data: userEntry, error: fetchUserError } = await supabase
      .from('Users')
      .select('email')
      .eq('role', userData.role)
      .eq('email', userData.oldEmail || emailField) // Use oldEmail if provided (for patients)
      .single();
    if (fetchUserError) throw new Error(`Failed to fetch Users entry: ${fetchUserError.message}`);
    if (!userEntry) throw new Error(`No Users entry found for email: ${userData.oldEmail || emailField}`);

    // Update email in Users table
    const { error: userUpdateError } = await supabase
      .from('Users')
      .update({ email: emailField })
      .eq('role', userData.role)
      .eq('email', userData.oldEmail || emailField);
    if (userUpdateError) throw new Error(`Users table update failed: ${userUpdateError.message}`);
  }

  if (userData.role === 'patient') {
    // Exclude role from Patient table update
    const { role, oldEmail, ...patientData } = userData;
    ({ data, error } = await supabase
      .from('Patient')
      .update(patientData)
      .eq('id', id)
      .select());
  } else if (userData.role === 'dentist') {
    ({ data, error } = await supabase
      .from('Dentist')
      .update(userData)
      .eq('id', id)
      .select());
  } else if (userData.role === 'secretary') {
    // Exclude Password and ConfirmPassword from secretary table update
    const { Password, ConfirmPassword, role, oldEmail, ...secretaryData } = userData;
    ({ data, error } = await supabase
      .from('secretary')
      .update(secretaryData)
      .eq('id', id)
      .select());
  }
  if (error) throw error;
  console.log(`Updated ${userData.role}:`, data);
  return data[0];
};

// Delete user (modified to remove from Users table)
export const deleteUser = async (id, role) => {
  let error;

  // Fetch the email from the role-specific table to delete from Users
  let emailToDelete;
  if (role === 'patient') {
    const { data: patient, error: fetchError } = await supabase
      .from('Patient')
      .select('Email')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    emailToDelete = patient?.Email;
  } else if (role === 'dentist') {
    const { data: dentist, error: fetchError } = await supabase
      .from('Dentist')
      .select('Email')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    emailToDelete = dentist?.Email;
  } else if (role === 'secretary') {
    const { data: secretary, error: fetchError } = await supabase
      .from('secretary')
      .select('email')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;
    emailToDelete = secretary?.email;
  }

  // Delete from Users table
  if (emailToDelete) {
    const { error: userDeleteError } = await supabase
      .from('Users')
      .delete()
      .eq('email', emailToDelete)
      .eq('role', role);
    if (userDeleteError) throw new Error(`Users table delete failed: ${userDeleteError.message}`);
  }

  // Delete from role-specific table
  if (role === 'patient') {
    ({ error } = await supabase
      .from('Patient')
      .delete()
      .eq('id', id));
  } else if (role === 'dentist') {
    await supabase
      .from('secretary')
      .delete()
      .eq('dental_id', id);
    ({ error } = await supabase
      .from('Dentist')
      .delete()
      .eq('id', id));
  } else if (role === 'secretary') {
    ({ error } = await supabase
      .from('secretary')
      .delete()
      .eq('id', id));
  }
  if (error) throw error;
  console.log(`Deleted ${role} with id ${id}`);
};

// Add secretary (unchanged)
export const addSecretary = async ({ email, password, name, dentistId }) => {
  try {
    // Sign up with Supabase Auth
    const { data: { user }, error: signUpError } = await supabase.auth.signUp(
      { email, password },
      {
        data: { role: 'secretary' },
        emailRedirectTo: window.location.origin,
      }
    );
    if (signUpError) {
      throw new Error(`Auth signup failed: ${signUpError.message}`);
    }
    if (!user) {
      throw new Error('Signup failed: No user returned.');
    }

    // Insert into Users table
    const { error: userInsertError } = await supabase
      .from('Users')
      .insert([{ email, role: 'secretary' }]);
    if (userInsertError) {
      throw new Error(`Users table insert failed: ${userInsertError.message}`);
    }

    // Insert into secretary table
    const secretaryData = {
      user_id: user.id,
      dentist_id: dentistId,
      name,
      email,
      role: 'secretary',
    };
    const { data: newSecretary, error: secretaryInsertError } = await supabase
      .from('secretary')
      .insert([secretaryData])
      .select()
      .single();
    if (secretaryInsertError) {
      throw new Error(`Secretary table insert failed: ${secretaryInsertError.message}`);
    }

    return newSecretary;
  } catch (error) {
    throw new Error(error.message);
  }
};