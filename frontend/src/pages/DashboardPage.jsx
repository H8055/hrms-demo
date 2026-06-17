import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import StatCard from '../components/StatCard';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

/* ── Icon sets for stat cards ───────────────────────────────── */
const EmployeeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const AttendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const LeaveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    <path d="M9 16l2 2 4-4"/>
  </svg>
);
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

/* ── Bar Chart (Headcount by Department) ───────────────────── */
function BarChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state" style={{ marginTop: '1rem' }}>No department data yet.</div>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  const chartH = 180;
  const barW = Math.max(20, Math.floor((320 - data.length * 8) / data.length));

  return (
    <div className="chart-container" style={{ paddingTop: '0.5rem' }}>
      <svg
        viewBox={`0 0 ${Math.max(320, data.length * (barW + 10))} ${chartH + 48}`}
        style={{ width: '100%', overflow: 'visible' }}
        aria-label="Headcount by department bar chart"
      >
        {/* Y grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => {
          const y = chartH - pct * chartH;
          return (
            <g key={pct}>
              <line x1="0" y1={y} x2="100%" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
              <text x="-4" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {Math.round(pct * max)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const h = Math.max(4, (d.count / max) * chartH);
          const x = i * (barW + 10) + 14;
          const y = chartH - h;
          return (
            <g key={d.department}>
              <rect x={x} y={y} width={barW} height={h} rx="4" fill="#22d3ee" opacity="0.85" />
              <text
                x={x + barW / 2}
                y={chartH + 16}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {d.department.slice(0, 8)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ── Line Chart (Attendance Rate) ───────────────────────────── */
function LineChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-state" style={{ marginTop: '1rem' }}>No attendance data yet.</div>;
  }

  const chartW = 300;
  const chartH = 140;
  const minVal = 80;
  const maxVal = 100;
  const range = maxVal - minVal;

  const hasRealData = data.some((d) => d.rate !== null);

  const displayData = data.map((d, i) => ({
    ...d,
    rate: d.rate !== null ? d.rate : null,
    x: (i / (data.length - 1)) * chartW,
    y: d.rate !== null ? chartH - ((d.rate - minVal) / range) * chartH : null
  }));

  const validPoints = displayData.filter((d) => d.y !== null);
  const polylinePoints = validPoints.map((d) => `${d.x},${d.y}`).join(' ');

  return (
    <div className="chart-container" style={{ paddingTop: '0.5rem' }}>
      <svg
        viewBox={`-20 -10 ${chartW + 30} ${chartH + 40}`}
        style={{ width: '100%', overflow: 'visible' }}
        aria-label="Weekly attendance rate line chart"
      >
        {/* Y grid + labels */}
        {[80, 85, 90, 95, 100].map((v) => {
          const y = chartH - ((v - minVal) / range) * chartH;
          return (
            <g key={v}>
              <line x1="0" y1={y} x2={chartW} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
              <text x="-8" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{v}</text>
            </g>
          );
        })}

        {/* Line + area fill */}
        {hasRealData && validPoints.length > 1 && (
          <>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`${validPoints[0].x},${chartH} ${polylinePoints} ${validPoints[validPoints.length - 1].x},${chartH}`}
              fill="url(#areaGrad)"
            />
            <polyline
              points={polylinePoints}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {validPoints.map((d) => (
              <circle key={d.week} cx={d.x} cy={d.y} r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
            ))}
          </>
        )}

        {/* X axis labels */}
        {displayData.map((d) => (
          <text key={d.week} x={d.x} y={chartH + 18} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {d.week}
          </text>
        ))}

        {/* Rate labels */}
        {validPoints.map((d) => (
          <text key={`lbl-${d.week}`} x={d.x} y={d.y - 9} textAnchor="middle" fontSize="10" fill="#3b82f6" fontWeight="600">
            {d.rate}%
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ── Recent Leave requests widget ───────────────────────────── */
function RecentLeaveRow({ item }) {
  const initials = (item.user?.name || 'UN').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const colorIdx = initials.charCodeAt(0) % 10;
  const statusClass = item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending';

  return (
    <div className="list-item" style={{ padding: '0.75rem 0.9rem', background: 'var(--panel-soft)', borderRadius: '10px', border: '1px solid var(--panel-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div className={`emp-avatar emp-avatar-${colorIdx}`} style={{ width: 32, height: 32, fontSize: '0.72rem' }}>{initials}</div>
        <div>
          <strong style={{ fontSize: '0.875rem' }}>{item.user?.name || 'Employee'}</strong>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>{item.leaveType} · {item.days} day{item.days !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <span className={`status-chip ${statusClass}`}>{item.status}</span>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [recentAdvances, setRecentAdvances] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, leavesRes, advancesRes] = await Promise.all([
          api.get('/employees/stats'),
          hasPermission('leave', 'view') ? api.get('/leaves?limit=5') : Promise.resolve({ data: { items: [] } }),
          hasPermission('advance', 'view') ? api.get('/advances?limit=5') : Promise.resolve({ data: { items: [] } })
        ]);
        setStats(statsRes.data);
        setRecentLeaves((leavesRes.data.items || []).slice(0, 5));
        setRecentAdvances((advancesRes.data.items || []).slice(0, 5));
      } catch {
        setStats(null);
      }
    }
    load();
  }, []);

  const deptData = stats?.departmentHeadcount || [];
  const weeklyData = stats?.weeklyAttendanceRate || [];

  return (
    <AppLayout title="Dashboard">
      {/* ── KPI Stats Row ─────────────────────────────────────── */}
      <div className="stats-grid">
        <StatCard
          title="Total Employees"
          value={stats?.totalEmployees ?? '—'}
          icon={<EmployeeIcon />}
          iconColor="blue"
          trendUp
          trendLabel={stats?.newThisMonth != null ? `+${stats.newThisMonth} new` : undefined}
        />
        <StatCard
          title="Present Today"
          value={stats?.presentToday ?? '—'}
          icon={<AttendIcon />}
          iconColor="green"
          trendUp
          trendLabel={stats?.presentTodayPercent != null ? `${stats.presentTodayPercent}%` : undefined}
        />
        <StatCard
          title="On Leave"
          value={stats?.onLeave ?? '—'}
          icon={<LeaveIcon />}
          iconColor="orange"
          trendUp={false}
          trendLabel={stats?.pendingLeaves != null ? `+${stats.pendingLeaves} pending` : undefined}
        />
        <StatCard
          title="Open Positions"
          value={stats?.openPositions ?? '—'}
          icon={<BriefcaseIcon />}
          iconColor="purple"
          trendUp
          trendLabel={stats?.openPositions != null ? `${stats.openPositions} roles` : undefined}
        />
      </div>

      {/* ── Charts Row ────────────────────────────────────────── */}
      <div className="two-column-layout">
        <article className="card card-elevated">
          <div className="section-header">
            <div>
              <h3>Headcount by Department</h3>
              <p>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>
            <a href="/employees" className="chart-view-link">
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          </div>
          <BarChart data={deptData} />
        </article>

        <article className="card card-elevated">
          <div className="section-header">
            <div>
              <h3>Attendance Rate</h3>
              <p>Last 6 weeks</p>
            </div>
          </div>
          <LineChart data={weeklyData} />
        </article>
      </div>

      {/* ── Activity Row ──────────────────────────────────────── */}
      <div className="two-column-layout">
        {/* Recent Leaves */}
        <article className="card card-elevated">
          <div className="section-header">
            <div>
              <h3>Recent Leave Requests</h3>
              <p>Latest submissions across the team</p>
            </div>
            <a href="/leaves" className="chart-view-link">View all</a>
          </div>
          <div className="list-stack">
            {recentLeaves.length === 0 ? (
              <div className="empty-state">No leave requests yet.</div>
            ) : (
              recentLeaves.map((item) => <RecentLeaveRow key={item.id} item={item} />)
            )}
          </div>
        </article>

        {/* Recent Advances */}
        <article className="card card-elevated">
          <div className="section-header">
            <div>
              <h3>Recent Advance Requests</h3>
              <p>Priority workflow activity</p>
            </div>
            <a href="/advances/my" className="chart-view-link">View all</a>
          </div>
          <div className="list-stack">
            {recentAdvances.length === 0 ? (
              <div className="empty-state">No advance activity yet.</div>
            ) : (
              recentAdvances.map((item) => {
                const statusClass = item.status === 'approved' || item.status === 'paid' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending';
                const initials = (item.requestedBy?.name || 'UN').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
                const colorIdx = initials.charCodeAt(0) % 10;
                return (
                  <div key={item.id} className="list-item" style={{ padding: '0.75rem 0.9rem', background: 'var(--panel-soft)', borderRadius: '10px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div className={`emp-avatar emp-avatar-${colorIdx}`} style={{ width: 32, height: 32, fontSize: '0.72rem' }}>{initials}</div>
                      <div>
                        <strong style={{ fontSize: '0.875rem' }}>{item.requestedBy?.name || user.name}</strong>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>{item.reason?.slice(0, 35)}{item.reason?.length > 35 ? '…' : ''}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                      <span className={`status-chip ${statusClass}`}>{item.status}</span>
                      <strong style={{ fontSize: '0.82rem' }}>
                        {typeof item.amount === 'number' ? `$${item.amount.toLocaleString()}` : '—'}
                      </strong>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </div>
    </AppLayout>
  );
}
