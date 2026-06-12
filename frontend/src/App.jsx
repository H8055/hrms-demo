import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdvanceRequestPage from './pages/AdvanceRequestPage';
import AdvanceAdminPage from './pages/AdvanceAdminPage';
import MyAdvancesPage from './pages/MyAdvancesPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import LeavePage from './pages/LeavePage';
import PayrollPage from './pages/PayrollPage';
import PerformancePage from './pages/PerformancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves"
        element={
          <ProtectedRoute>
            <LeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advances/request"
        element={
          <ProtectedRoute>
            <AdvanceRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advances/my"
        element={
          <ProtectedRoute>
            <MyAdvancesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advances/admin"
        element={
          <ProtectedRoute roles={['admin', 'hr', 'manager']}>
            <AdvanceAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <PayrollPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <PerformancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute roles={['admin', 'hr', 'manager']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute roles={['admin', 'hr']}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
