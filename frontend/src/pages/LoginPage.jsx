import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

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

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bootstrap, setBootstrap] = useState({ loading: true, requiresSetup: false, apiReachable: true });

  useEffect(() => {
    const msg = location.state?.message;
    if (msg) toastSuccess(msg);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadBootstrapStatus() {
      try {
        const { data } = await api.get('/auth/bootstrap-status');
        setBootstrap({
          loading: false,
          requiresSetup: Boolean(data.requiresSetup),
          apiReachable: true
        });
      } catch {
        setBootstrap({ loading: false, requiresSetup: false, apiReachable: false });
      }
    }

    loadBootstrapStatus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(form);
      navigate('/');
    } catch (err) {
      toastError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-panel auth-panel-primary">
        <div className="auth-copy">
          <span className="eyebrow">MS HRMS</span>
          <h1>Human Resource Management System</h1>
          <p>Manage your workforce efficiently — from attendance and leave to payroll and advance requests, all in one place.</p>
        </div>
      </section>

      <section className="auth-panel auth-panel-form">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Sign in</h2>
            <p>Use your work account to continue.</p>
          </div>

          {!bootstrap.loading && !bootstrap.apiReachable ? (
            <div className="alert alert-error">
              Cannot reach the backend API. Please make sure the backend server and MongoDB are running.
            </div>
          ) : null}

          {!bootstrap.loading && bootstrap.requiresSetup ? (
            <div className="alert alert-success">
              No users exist yet. <Link to="/setup-admin">Create the first admin account</Link> before logging in.
            </div>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-eye-btn"
                onClick={() => setShowPassword((s) => !s)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          <button className="primary-button" type="submit" disabled={submitting || bootstrap.requiresSetup}>
            {submitting ? 'Signing in...' : 'Login'}
          </button>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </form>
      </section>
    </div>
  );
}
