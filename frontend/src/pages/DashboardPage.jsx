import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const flowCardsByRole = {
  employee: [
    { title: 'Self-service', description: 'Track attendance, apply leave, and follow your advance request status.' },
    { title: 'Advance requests', description: 'Submit amount, reason, and repayment plan from any device.' },
    { title: 'History visibility', description: 'See pending, approved, rejected, and paid milestones in one timeline.' }
  ],
  hr: [
    { title: 'HR manager view', description: 'Review employee requests, approvals, payroll linkage, and reports.' },
    { title: 'Priority module', description: 'Advance requests now include review history, notifications, and payment steps.' },
    { title: 'Responsive action center', description: 'Approve or reject from tablet/mobile without losing the full request context.' }
  ],
  manager: [
    { title: 'Line manager flow', description: 'Review team-related requests and decision history quickly.' },
    { title: 'Approvals', description: 'Assess amount, reason, employee history, and next action from one panel.' },
    { title: 'System notifications', description: 'Receive in-app alerts when a new request needs attention.' }
  ],
  admin: [
    { title: 'Admin control', description: 'Own the end-to-end flow: alert, review, approve/reject, and process payment.' },
    { title: 'Audit-ready history', description: 'Every advance step is logged and visible to the right users.' },
    { title: 'Priority workflow', description: 'The advance request module is implemented first as the project’s priority feature.' }
  ]
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryResponse, listResponse] = await Promise.all([
          api.get('/advances/summary'),
          ['admin', 'hr', 'manager'].includes(user.role)
            ? api.get('/advances?limit=5')
            : api.get('/advances/mine')
        ]);

        setSummary(summaryResponse.data);
        setRecentItems((listResponse.data.items || []).slice(0, 5));
      } catch {
        setSummary(null);
        setRecentItems([]);
      }
    }

    loadData();
  }, [user.role]);

  const roleCards = useMemo(() => flowCardsByRole[user.role] || flowCardsByRole.employee, [user.role]);

  return (
    <AppLayout
      title="Dashboard"
      description="Reviewed against your client flow diagram and aligned around the priority Advance Request module."
    >
      <section className="stats-grid">
        <StatCard title="Signed in as" value={user.role.toUpperCase()} hint={user.email} />
        <StatCard title="Pending requests" value={summary?.pendingCount ?? 0} hint="Awaiting review or action" />
        <StatCard
          title="Paid advances"
          value={`₹${(summary?.totalDisbursed ?? 0).toLocaleString('en-IN')}`}
          hint="Recorded disbursements"
        />
        <StatCard
          title="This month requested"
          value={`₹${(summary?.thisMonthRequested ?? 0).toLocaleString('en-IN')}`}
          hint={summary?.hasActiveRequest ? 'An active request already exists' : 'No active request restriction hit'}
        />
      </section>

      <section className="two-column-layout">
        <article className="card">
          <div className="section-header">
            <div>
              <h3>Flow review from your diagrams</h3>
              <p>These cards reflect the employee / HR / line manager flow you shared.</p>
            </div>
          </div>

          <div className="feature-grid">
            {roleCards.map((card) => (
              <div className="feature-card" key={card.title}>
                <strong>{card.title}</strong>
                <span>{card.description}</span>
              </div>
            ))}
            <div className="feature-card feature-card-highlight">
              <strong>Advance lifecycle</strong>
              <span>Submitted → pending → approved/rejected → paid → history log visible to employee and admin.</span>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="section-header">
            <div>
              <h3>Latest advance activity</h3>
              <p>Recent requests from the priority module.</p>
            </div>
          </div>

          <div className="list-stack">
            {recentItems.length === 0 ? (
              <div className="empty-state">No advance activity yet. Submit a request to start the flow.</div>
            ) : (
              recentItems.map((item) => (
                <div className="list-item" key={item.id}>
                  <div>
                    <strong>{item.requestedBy?.name || 'You'}</strong>
                    <p>{item.reason}</p>
                  </div>
                  <div className="list-meta">
                    <span className={`status-chip ${item.status}`}>{item.status}</span>
                    <strong>₹{item.amount.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </AppLayout>
  );
}
