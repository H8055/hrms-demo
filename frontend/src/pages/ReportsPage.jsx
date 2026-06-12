import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadReport() {
      try {
        const { data } = await api.get('/reports/overview');
        setReport(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reports');
      }
    }
    loadReport();
  }, []);

  return (
    <AppLayout title="Reports & Overview" description="Sprint 7-8 dashboard summary across employees, attendance, leave, payroll, advances, and performance.">
      {error ? <div className="alert alert-error">{error}</div> : null}
      {!report ? <div className="empty-state">Loading report...</div> : (
        <>
          <section className="stats-grid">
            <div className="stat-card"><p>Employees</p><h3>{report.employees}</h3><small>Total users in HRMS</small></div>
            <div className="stat-card"><p>Attendance</p><h3>{report.attendance.total}</h3><small>Total attendance entries</small></div>
            <div className="stat-card"><p>Leaves</p><h3>{report.leaves.total}</h3><small>Total leave requests</small></div>
            <div className="stat-card"><p>Payroll net</p><h3>₹{report.payroll.totalNetPay.toLocaleString('en-IN')}</h3><small>Total net payroll</small></div>
          </section>
          <section className="two-column-layout">
            <article className="card">
              <div className="section-header"><div><h3>Operations snapshot</h3><p>Cross-module reporting view.</p></div></div>
              <div className="feature-grid">
                <div className="feature-card"><strong>Attendance</strong><span>Present: {report.attendance.present} · On leave: {report.attendance.onLeave} · Pending regularization: {report.attendance.pendingRegularization}</span></div>
                <div className="feature-card"><strong>Leave</strong><span>Pending: {report.leaves.pending} · Approved: {report.leaves.approved}</span></div>
                <div className="feature-card"><strong>Payroll</strong><span>Paid: {report.payroll.paid} · Total records: {report.payroll.total}</span></div>
                <div className="feature-card"><strong>Performance</strong><span>Reviews: {report.performance.totalReviews} · Average rating: {report.performance.averageRating}</span></div>
              </div>
            </article>
            <article className="card">
              <div className="section-header"><div><h3>Advance summary</h3><p>Priority module health.</p></div></div>
              <div className="detail-stack">
                <div className="mini-stat"><strong>{report.advances.total}</strong><span>Total advance requests</span></div>
                <div className="mini-stat"><strong>{report.advances.pending}</strong><span>Pending advances</span></div>
                <div className="mini-stat"><strong>{report.advances.paid}</strong><span>Paid advances</span></div>
                <div className="mini-stat"><strong>₹{report.advances.totalDisbursed.toLocaleString('en-IN')}</strong><span>Total disbursed</span></div>
              </div>
            </article>
          </section>
        </>
      )}
    </AppLayout>
  );
}
