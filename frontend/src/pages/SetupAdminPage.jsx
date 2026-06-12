import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SetupAdminPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      });

      await login({ email: form.email, password: form.password });
      setMessage('First admin account created successfully. Redirecting...');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the first admin account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-panel auth-panel-primary">
        <div className="auth-copy">
          <span className="eyebrow">First-time setup</span>
          <h1>Create the first admin account to start using HRMS.</h1>
          <p>
            The backend already supports first-admin registration. This setup page makes the first login
            flow work from the UI.
          </p>
        </div>
      </section>

      <section className="auth-panel auth-panel-form">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Setup admin</h2>
            <p>Create the initial administrator account.</p>
          </div>

          {message ? <div className="alert alert-success">{message}</div> : null}
          {error ? <div className="alert alert-error">{error}</div> : null}

          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
          </label>

          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} required />
          </label>

          <label className="field">
            <span>Confirm password</span>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} required />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Creating admin...' : 'Create admin'}
          </button>

          <p className="helper-text">
            <Link to="/login">Back to login</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
