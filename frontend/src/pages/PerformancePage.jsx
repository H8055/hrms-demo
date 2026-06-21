import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const initialForm = {
  userId: '',
  cycle: new Date().getFullYear().toString(),
  goals: '',
  rating: 3,
  feedback: ''
};

export default function PerformancePage() {
  const { hasPermission } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const canManage = hasPermission('performance', 'create') || hasPermission('performance', 'approve') || hasPermission('performance', 'edit');
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(initialForm);

  async function loadData() {
    try {
      const requests = [api.get('/performance/summary'), api.get('/performance')];
      if (canManage) requests.push(api.get('/employees'));
      const [summaryRes, reviewsRes, employeesRes] = await Promise.all(requests);
      setSummary(summaryRes.data);
      setReviews(reviewsRes.data.items || []);
      setEmployees(employeesRes?.data?.items || []);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load performance data');
    }
  }

  useEffect(() => {
    loadData();
  }, [canManage]);

  async function submitReview(event) {
    event.preventDefault();
    try {
      await api.post('/performance', {
        ...form,
        goals: form.goals.split('\n').map((item) => item.trim()).filter(Boolean)
      });
      toastSuccess('Performance review saved.');
      setForm(initialForm);
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save performance review');
    }
  }

  return (
    <AppLayout title="Performance & Reviews" description="Sprint 7 MVP: reviews, goals, ratings, and manager feedback.">
      <section className="stats-grid compact-grid">
        <div className="stat-card"><p>Total reviews</p><h3>{summary?.totalReviews ?? 0}</h3><small>Visible performance reviews</small></div>
        <div className="stat-card"><p>Average rating</p><h3>{summary?.averageRating ?? 0}</h3><small>Across visible reviews</small></div>
      </section>

      <section className="split-layout">
        <article className="card">
          <div className="section-header">
            <div>
              <h3>{canManage ? 'Create review' : 'Review guidance'}</h3>
              <p>{canManage ? 'Capture cycle, goals, rating, and feedback.' : 'Managers and HR can add your reviews here.'}</p>
            </div>
          </div>
          {canManage ? (
            <form className="detail-stack" onSubmit={submitReview}>
              <div className="detail-grid">
                <label className="field"><span>Employee</span><select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} required><option value="">Select employee</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label className="field"><span>Cycle</span><input value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })} required /></label>
                <label className="field"><span>Rating</span><input type="number" min="1" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} required /></label>
              </div>
              <label className="field"><span>Goals (one per line)</span><textarea rows="4" value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} /></label>
              <label className="field"><span>Feedback</span><textarea rows="4" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} /></label>
              <button className="primary-button" type="submit">Save review</button>
            </form>
          ) : (
            <div className="empty-state">Your performance reviews are shown on the right.</div>
          )}
        </article>

        <article className="card detail-card">
          <div className="section-header"><div><h3>Reviews</h3><p>Goals, ratings, and written feedback.</p></div></div>
          <div className="list-stack">
            {reviews.map((item) => (
              <div className="timeline-card" key={item.id}>
                <div className="timeline-head"><strong>{item.user?.name}</strong><span className="status-chip approved">{item.rating}/5</span></div>
                <p>{item.feedback || 'No feedback added.'}</p>
                <div className="timeline-meta stacked-meta">
                  <span>Cycle: {item.cycle}</span>
                  <span>Reviewer: {item.reviewer?.name}</span>
                  {item.goals?.length ? <span>Goals: {item.goals.join(' • ')}</span> : null}
                </div>
              </div>
            ))}
            {reviews.length === 0 ? <div className="empty-state">No performance reviews yet.</div> : null}
          </div>
        </article>
      </section>
    </AppLayout>
  );
}
