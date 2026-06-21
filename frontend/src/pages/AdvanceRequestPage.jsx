import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

const initialState = {
  amount: '',
  reason: '',
  repaymentPlan: '',
  notes: ''
};

const flowSteps = [
  'Employee submits amount, reason, and repayment plan',
  'Request is created with pending status',
  'Admin / HR / manager receives email and in-app alert',
  'Decision is recorded as approved or rejected',
  'If approved, payment is processed and marked paid',
  'History stays visible to employee and admin'
];

export default function AdvanceRequestPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [form, setForm] = useState(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState(null);

  async function loadSummary() {
    try {
      const { data } = await api.get('/advances/summary');
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await api.post('/advances', {
        amount: Number(form.amount),
        reason: form.reason,
        repaymentPlan: form.repaymentPlan,
        notes: form.notes
      });
      toastSuccess('Advance request submitted successfully. Status is now pending.');
      setForm(initialState);
      loadSummary();
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not submit advance request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout
      title="Request Advance"
      description="This priority module follows your reference flow: submit → alert → review → approve/reject → payment → visible history."
    >
      <section className="two-column-layout align-start">
        <form className="card form-card full-width-card" onSubmit={handleSubmit}>
          <div className="section-header">
            <div>
              <h3>Advance Request Form</h3>
              <p>Responsive, touch-friendly, and designed for 375px to desktop screens.</p>
            </div>
          </div>

          {summary?.hasActiveRequest ? (
            <div className="alert alert-error">
              You already have a pending or approved advance request. A new request will be blocked until that one is completed.
            </div>
          ) : null}

          <div className="form-grid">
            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                placeholder="25000"
                required
              />
            </label>

            <label className="field">
              <span>Repayment plan</span>
              <input
                type="text"
                value={form.repaymentPlan}
                onChange={(e) => setForm((prev) => ({ ...prev, repaymentPlan: e.target.value }))}
                placeholder="Deduct over 5 salary cycles"
                required
              />
            </label>
          </div>

          <label className="field">
            <span>Reason</span>
            <textarea
              rows="4"
              value={form.reason}
              onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="Medical emergency / family support / relocation"
              required
            />
          </label>

          <label className="field">
            <span>Notes (optional)</span>
            <textarea
              rows="3"
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional context for the reviewer"
            />
          </label>

          <button className="primary-button" type="submit" disabled={submitting || summary?.hasActiveRequest}>
            {submitting ? 'Submitting...' : 'Submit request'}
          </button>
        </form>

        <article className="card full-width-card">
          <div className="section-header">
            <div>
              <h3>What happens next</h3>
              <p>Mapped directly from your advance request flow diagram.</p>
            </div>
          </div>

          <div className="step-list">
            {flowSteps.map((step, index) => (
              <div className="step-item" key={step}>
                <span className="step-number">{index + 1}</span>
                <div>
                  <strong>{step}</strong>
                </div>
              </div>
            ))}
          </div>

          <div className="mini-metrics">
            <div className="mini-stat">
              <strong>{summary?.totalRequests ?? 0}</strong>
              <span>Total requests</span>
            </div>
            <div className="mini-stat">
              <strong>{summary?.pendingCount ?? 0}</strong>
              <span>Pending</span>
            </div>
            <div className="mini-stat">
              <strong>₹{(summary?.thisMonthRequested ?? 0).toLocaleString('en-IN')}</strong>
              <span>This month</span>
            </div>
          </div>
        </article>
      </section>
    </AppLayout>
  );
}
