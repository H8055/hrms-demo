import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ReportsPage() {
  const { error: toastError } = useToast();
  const [report, setReport] = useState(null);

  useEffect(() => {
    async function loadReport() {
      try {
        const { data } = await api.get('/reports/overview');
        setReport(data);
      } catch (err) {
        toastError(err.response?.data?.message || 'Failed to load reports');
      }
    }
    loadReport();
  }, []);

  return (
    <AppLayout
      eyebrow="Operations analytics"
      title="Reports & Overview"
      description="Cross-module reporting surface for leaders, with a cleaner production-style summary of employees, attendance, leave, payroll, and advances."
    >
      {!report ? (
        <div className="empty-state">Loading report...</div>
      ) : (
        <>
          <section className="stats-grid">
            <div className="stat-card"><p>Employees</p><h3>{report.employees}</h3><small>Total users in HRMS</small></div>
            <div className="stat-card"><p>Attendance</p><h3>{report.attendance.total}</h3><small>Total attendance entries</small></div>
            <div className="stat-card"><p>Leaves</p><h3>{report.leaves.total}</h3><small>Total leave requests</small></div>
            <div className="stat-card"><p>Payroll net</p><h3>₹{report.payroll.totalNetPay.toLocaleString('en-IN')}</h3><small>Total net payroll</small></div>
          </section>

          <section className="two-column-layout">
            <article className="card card-elevated">
              <div className="section-header"><div><h3>Operations snapshot</h3><p>Cross-module reporting view with attention points for HR leadership.</p></div></div>
              <div className="feature-grid">
                <div className="feature-card"><strong>Attendance</strong><span>Present: {report.attendance.present} · On leave: {report.attendance.onLeave} · Pending regularization: {report.attendance.pendingRegularization}</span></div>
                <div className="feature-card"><strong>Leave</strong><span>Pending: {report.leaves.pending} · Approved: {report.leaves.approved}</span></div>
                <div className="feature-card"><strong>Payroll</strong><span>Paid: {report.payroll.paid} · Total records: {report.payroll.total}</span></div>
                <div className="feature-card"><strong>Performance</strong><span>Reviews: {report.performance.totalReviews} · Average rating: {report.performance.averageRating}</span></div>
              </div>
            </article>
            <article className="card card-elevated">
              <div className="section-header"><div><h3>Advance summary</h3><p>Priority module health and financial footprint.</p></div></div>
              <div className="detail-stack">
                <div className="mini-stat"><strong>{report.advances.total}</strong><span>Total advance requests</span></div>
                <div className="mini-stat"><strong>{report.advances.pending}</strong><span>Pending advances</span></div>
                <div className="mini-stat"><strong>{report.advances.paid}</strong><span>Paid advances</span></div>
                <div className="mini-stat"><strong>₹{report.advances.totalDisbursed.toLocaleString('en-IN')}</strong><span>Total disbursed</span></div>
              </div>
            </article>
          </section>

          <section className="two-column-layout">
            <article className="card card-elevated">
              <div className="section-header"><div><h3>Release readiness notes</h3><p>Useful reminders while moving toward production.</p></div></div>
              <div className="list-stack">
                <div className="mini-history-item"><div><strong>Verify backups</strong><p>Before go-live, make sure MongoDB backup and restore procedures are tested.</p></div><span className="status-chip pending">ops</span></div>
                <div className="mini-history-item"><div><strong>Watch rate limits</strong><p>Auth hardening is enabled. Tune limits and alerts per environment.</p></div><span className="status-chip approved">enabled</span></div>
                <div className="mini-history-item"><div><strong>Run UAT sweep</strong><p>Confirm major HR, employee, and manager flows before release sign-off.</p></div><span className="status-chip pending">next</span></div>
              </div>
            </article>
            <article className="card card-elevated">
              <div className="section-header"><div><h3>Data quality overview</h3><p>Simple operational indicators based on current report totals.</p></div></div>
              <div className="feature-grid compact">
                <div className="feature-card"><strong>{report.employees}</strong><span>Employees currently represented in the dataset.</span></div>
                <div className="feature-card"><strong>{report.leaves.pending}</strong><span>Leave approvals still requiring attention.</span></div>
                <div className="feature-card"><strong>{report.attendance.pendingRegularization}</strong><span>Attendance records waiting for final correction.</span></div>
                <div className="feature-card"><strong>{report.payroll.total}</strong><span>Payroll records available for the current reporting window.</span></div>
              </div>
            </article>
          </section>
        </>
      )}
    </AppLayout>
  );
}
