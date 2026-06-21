import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import SetupAdminPage from './pages/SetupAdminPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdvanceRequestPage from './pages/AdvanceRequestPage';
import AdvanceAdminPage from './pages/AdvanceAdminPage';
import MyAdvancesPage from './pages/MyAdvancesPage';
import EmployeesPage from './pages/EmployeesPage';
import ProfilePage from './pages/ProfilePage';
import ChangeRequestsPage from './pages/ChangeRequestsPage';
import AttendancePage from './pages/AttendancePage';
import LeavePage from './pages/LeavePage';
import PayrollPage from './pages/PayrollPage';
import PerformancePage from './pages/PerformancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import PermissionsPage from './pages/PermissionsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/setup-admin" element={isAuthenticated ? <Navigate to="/" replace /> : <SetupAdminPage />} />
      <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
      <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute permission={{ module: 'dashboard', action: 'view' }}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/change-requests"
        element={
          <ProtectedRoute anyPermissions={[{ module: 'employee', action: 'view' }]}>
            <ChangeRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute permission={{ module: 'employee', action: 'view' }}>
            <EmployeesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute permission={{ module: 'attendance', action: 'view' }}>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaves"
        element={
          <ProtectedRoute permission={{ module: 'leave', action: 'view' }}>
            <LeavePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advances/request"
        element={
          <ProtectedRoute permission={{ module: 'advance', action: 'create' }}>
            <AdvanceRequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advances/my"
        element={
          <ProtectedRoute permission={{ module: 'advance', action: 'view' }}>
            <MyAdvancesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advances/admin"
        element={
          <ProtectedRoute anyPermissions={[{ module: 'advance', action: 'approve' }, { module: 'advance', action: 'pay' }]}>
            <AdvanceAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute permission={{ module: 'payroll', action: 'view' }}>
            <PayrollPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoute permission={{ module: 'performance', action: 'view' }}>
            <PerformancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute permission={{ module: 'reports', action: 'view' }}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute permission={{ module: 'settings', action: 'view' }}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/permissions"
        element={
          <ProtectedRoute permission={{ module: 'permissions', action: 'view' }}>
            <PermissionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute permission={{ module: 'permissions', action: 'view' }}>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
