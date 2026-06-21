import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [email, setEmail] = useState('');
  const [previewToken, setPreviewToken] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setPreviewToken('');

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toastSuccess(data.message || 'If that email exists, a reset link has been sent.');
      setPreviewToken(data.previewToken || '');
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not submit forgot password request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <section className="auth-panel auth-panel-primary">
        <div className="auth-copy">
          <span className="eyebrow">Password recovery</span>
          <h1>Reset access securely from mobile or desktop.</h1>
          <p>The reset flow is wired to the backend and supports email or development preview tokens.</p>
        </div>
      </section>

      <section className="auth-panel auth-panel-form">
        <form className="card form-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Forgot password</h2>
            <p>Enter your email to request a reset link.</p>
          </div>

          {previewToken ? (
            <div className="alert alert-success">
              Development preview token: <code>{previewToken}</code>
            </div>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Send reset link'}
          </button>

          <p className="helper-text">
            <Link to="/login">Back to login</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
