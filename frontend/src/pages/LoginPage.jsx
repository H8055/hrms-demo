import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

const features = [
  { icon: '◫', title: 'Smart Dashboard', desc: 'Real-time KPIs, headcount charts, and attendance rates at a glance.' },
  { icon: '👥', title: 'Employee Directory', desc: 'Searchable profiles, org chart, and document management.' },
  { icon: '$', title: 'Advance Requests', desc: 'Full approval workflow from submission through payment.' },
  { icon: '✔', title: 'Leave & Attendance', desc: 'Apply, approve, and track across the entire team.' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bootstrap, setBootstrap] = useState({ loading: true, requiresSetup: false, apiReachable: true });

  useEffect(() => {
    async function loadBootstrapStatus() {
      try {
        const { data } = await api.get('/auth/bootstrap-status');
        setBootstrap({ loading: false, requiresSetup: Boolean(data.requiresSetup), apiReachable: true });
      } catch {
        setBootstrap({ loading: false, requiresSetup: false, apiReachable: false });
      }
    }
    loadBootstrapStatus();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      {/* Left: branding panel */}
      <section className="auth-panel auth-panel-primary">
        <div className="auth-copy">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <img src="/mslogo.png" alt="MS HRMS" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'contain', background: 'white', padding: 4, flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'white' }}>MS HRMS</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>HR Management Platform</div>
              </div>
            </div>
            <h1>Built for HR teams that move fast.</h1>
            <p>Everything you need to manage employees, track attendance, process leaves, and run advance request workflows — desktop and mobile.</p>
          </div>

          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {features.map((f) => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '0.9rem 1rem', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: '0.1rem' }}>{f.icon}</span>
                <div>
                  <strong style={{ color: 'white', fontSize: '0.9rem' }}>{f.title}</strong>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Right: login form */}
      <section className="auth-panel auth-panel-form" style={{ background: 'var(--bg)' }}>
        <div className="card form-card">
          {/* Logo (shown on mobile when left panel is hidden) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.75rem' }}>
            <img src="/mslogo.png" alt="MS HRMS" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>MS HRMS</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>HR Management</div>
            </div>
          </div>

          <div className="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your HR workspace</p>
          </div>

          {!bootstrap.loading && !bootstrap.apiReachable && (
            <div className="alert alert-error">
              Cannot reach the backend API. Make sure the server and MongoDB are running.
            </div>
          )}
          {!bootstrap.loading && bootstrap.requiresSetup && (
            <div className="alert alert-success">
              No users yet. <Link to="/setup-admin">Create the first admin</Link> before logging in.
            </div>
          )}
          {!bootstrap.loading && bootstrap.apiReachable && !bootstrap.requiresSetup && (
            <div className="alert alert-success" style={{ fontSize: '0.82rem' }}>
              Demo: <strong>admin@example.com</strong> / <strong>Password@123</strong>
            </div>
          )}
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 0 }}>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="you@company.com"
                required
                autoComplete="email"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </label>

            <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Forgot password?</Link>
            </div>

            <button className="primary-button" type="submit" disabled={submitting || bootstrap.requiresSetup} style={{ width: '100%', justifyContent: 'center', minHeight: 46, fontSize: '0.95rem' }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="auth-links" style={{ marginTop: '1.25rem' }}>
            <Link to="/setup-admin">Setup admin</Link>
            <span>·</span>
            <Link to="/reset-password">Have a reset token?</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
