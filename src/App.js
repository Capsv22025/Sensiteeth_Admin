import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoutes';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import DentistManagement from './components/AdminDashboard/DentistManagement';
import PatientManagement from './components/AdminDashboard/PatientManagement';
import AppointmentManagement from './components/AdminDashboard/AppointmentManagement';
import AvailabilityManagement from './components/AdminDashboard/AvailabilityManagement';
import Reports from './components/AdminDashboard/Reports';
import Dashboard from './components/AdminDashboard/Dashboard';
import NotFound from './pages/NotFound';
import './styles/global.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dentist-management" element={<DentistManagement />} />
            <Route path="patient-management" element={<PatientManagement />} />
            <Route path="appointment-management" element={<AppointmentManagement />} />
            <Route path="availability-management" element={<AvailabilityManagement />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;