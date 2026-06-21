import { useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function PasswordField({ label, value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-input-wrapper">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-eye-btn"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </label>
  );
}

export default function ChangePasswordPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.newPassword === form.oldPassword) {
      toastError('New password must be different from the current password.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toastError('New password and confirm password do not match.');
      return;
    }
    if (form.newPassword.length < 8) {
      toastError('New password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/change-password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      });
      localStorage.removeItem('hrms_access_token');
      toastSuccess('Password changed successfully.');
      // Hard reload to /login — clears React auth state so the login guard doesn't bounce back
      setTimeout(() => {
        window.location.replace('/login');
      }, 2000);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to change password');
      setSubmitting(false);
    }
  }

  return (
    <AppLayout eyebrow="Account" title="Change Password" description="Update your login password.">
      <div className="form-page-layout">
        <form className="card form-card" onSubmit={handleSubmit}>
          <PasswordField
            label="Current Password"
            value={form.oldPassword}
            onChange={(e) => setField('oldPassword', e.target.value)}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />

          <PasswordField
            label="New Password"
            value={form.newPassword}
            onChange={(e) => setField('newPassword', e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />

          <PasswordField
            label="Confirm New Password"
            value={form.confirmPassword}
            onChange={(e) => setField('confirmPassword', e.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Password'}
            </button>
          </div>

          <p className="helper-text">
            After saving, you will be logged out and must sign in with your new password.
          </p>
        </form>
      </div>
    </AppLayout>
  );
}
