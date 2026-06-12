import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-panel auth-panel-primary">
        <div className="auth-copy">
          <span className="eyebrow">MERN • mobile-first • responsive</span>
          <h1>HRMS for teams that need desktop power and mobile simplicity.</h1>
          <p>
            This starter includes secure authentication, a responsive dashboard shell, and the
            Advance Request workflow from your sprint plan.
          </p>
          <div className="feature-grid compact">
            <div className="feature-card"><strong>375px</strong><span>Phone-ready forms</span></div>
            <div className="feature-card"><strong>768px</strong><span>Tablet-friendly layout</span></div>
            <div className="feature-card"><strong>1280px</strong><span>Desktop data density</span></div>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-panel-form">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Sign in</h2>
            <p>Use your work account to continue.</p>
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="admin@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Password@123"
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Login'}
          </button>

          <div className="auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
            <span>•</span>
            <Link to="/reset-password">Have a token?</Link>
          </div>

          <p className="helper-text">
            Tip: register the first admin via <code>POST /api/auth/register</code>.
          </p>
        </form>
      </section>
    </div>
  );
}
