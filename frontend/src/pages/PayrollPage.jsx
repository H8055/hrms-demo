import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const initialStructure = {
  userId: '',
  basic: 0,
  hra: 0,
  allowances: 0,
  statutoryDeductions: 0,
  otherDeductions: 0
};

export default function PayrollPage() {
  const { user, hasPermission } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const canManage = hasPermission('payroll', 'edit') || hasPermission('payroll', 'create') || hasPermission('payroll', 'approve');
  const [summary, setSummary] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [structureForm, setStructureForm] = useState(initialStructure);
  const [runMonth, setRunMonth] = useState(new Date().toISOString().slice(0, 7));

  async function loadData() {
    try {
      const requests = [api.get('/payroll/summary'), api.get('/payroll')];
      if (canManage) {
        requests.push(api.get('/employees'));
        requests.push(api.get('/payroll/structures'));
      }
      const [summaryRes, payrollRes, employeesRes, structuresRes] = await Promise.all(requests);
      setSummary(summaryRes.data);
      setPayrolls(payrollRes.data.items || []);
      setEmployees(employeesRes?.data?.items || []);
      setStructures(structuresRes?.data?.items || []);
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to load payroll data');
    }
  }

  useEffect(() => {
    loadData();
  }, [canManage]);

  const myLatestPayrolls = useMemo(
    () => payrolls.filter((item) => (canManage ? true : item.user?.id === user.id)).slice(0, 12),
    [payrolls, canManage, user.id]
  );

  const totalGross = useMemo(
    () => myLatestPayrolls.reduce((sum, item) => sum + (item.grossPay || 0), 0),
    [myLatestPayrolls]
  );

  async function saveStructure(event) {
    event.preventDefault();
    try {
      await api.post('/payroll/structures', structureForm);
      toastSuccess('Salary structure saved.');
      setStructureForm(initialStructure);
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to save salary structure');
    }
  }

  async function runPayroll() {
    try {
      await api.post('/payroll/run', { month: runMonth });
      toastSuccess('Payroll run completed.');
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to run payroll');
    }
  }

  async function markPaid(id) {
    try {
      await api.put(`/payroll/${id}/pay`);
      toastSuccess('Payroll marked as paid.');
      loadData();
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to mark payroll as paid');
    }
  }

  return (
    <AppLayout
      eyebrow="Payroll operations"
      title="Payroll"
      description="Production-focused payroll surface with clear actions, salary structures, monthly run controls, and employee payout visibility."
    >
      <section className="stats-grid compact-grid">
        <div className="stat-card"><p>Total payrolls</p><h3>{summary?.totalPayrolls ?? 0}</h3><small>Generated payslips</small></div>
        <div className="stat-card"><p>Paid</p><h3>{summary?.paidCount ?? 0}</h3><small>Marked as paid</small></div>
        <div className="stat-card"><p>Draft</p><h3>{summary?.draftCount ?? 0}</h3><small>Awaiting payment</small></div>
        <div className="stat-card"><p>Total net pay</p><h3>₹{(summary?.totalNetPay ?? 0).toLocaleString('en-IN')}</h3><small>Across visible payrolls</small></div>
      </section>

      <section className="two-column-layout">
        <article className="card card-elevated">
          <div className="section-header">
            <div>
              <h3>{canManage ? 'Payroll control center' : 'My payroll summary'}</h3>
              <p>
                {canManage
                  ? 'Configure salary structures, run a cycle, and review generated payroll records.'
                  : 'Review the latest visible payroll totals and paid status.'}
              </p>
            </div>
          </div>
          <div className="feature-grid compact">
            <div className="feature-card">
              <strong>Visible payroll records</strong>
              <span>{myLatestPayrolls.length} records currently loaded for this view.</span>
            </div>
            <div className="feature-card">
              <strong>Total gross in view</strong>
              <span>₹{totalGross.toLocaleString('en-IN')} combined gross pay across listed records.</span>
            </div>
          </div>
        </article>

        <article className="card card-elevated">
          <div className="section-header">
            <div>
              <h3>Operator notes</h3>
              <p>Use this area as a quick pre-run checklist for payroll handling.</p>
            </div>
          </div>
          <div className="list-stack">
            <div className="mini-history-item"><div><strong>Check structures</strong><p>Ensure employees have updated salary structures before the payroll run.</p></div><span className="status-chip approved">ready</span></div>
            <div className="mini-history-item"><div><strong>Verify deductions</strong><p>Advance deductions and payroll totals should be reviewed before marking paid.</p></div><span className="status-chip pending">review</span></div>
            <div className="mini-history-item"><div><strong>Communicate release</strong><p>Employees should be notified once payroll records are paid and visible.</p></div><span className="status-chip approved">tracked</span></div>
          </div>
        </article>
      </section>

      <section className="split-layout">
        <article className="card detail-card card-elevated">
          <div className="section-header">
            <div>
              <h3>{canManage ? 'Payroll controls' : 'My payslips'}</h3>
              <p>{canManage ? 'Configure salary structures and trigger payroll runs.' : 'View payroll status and net pay.'}</p>
            </div>
          </div>

          {canManage ? (
            <div className="detail-stack">
              <form className="sub-card" onSubmit={saveStructure}>
                <h4>Salary structure</h4>
                <div className="detail-grid">
                  <label className="field"><span>Employee</span><select value={structureForm.userId} onChange={(e) => setStructureForm({ ...structureForm, userId: e.target.value })} required><option value="">Select employee</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  <label className="field"><span>Basic</span><input type="number" value={structureForm.basic} onChange={(e) => setStructureForm({ ...structureForm, basic: Number(e.target.value) })} /></label>
                  <label className="field"><span>HRA</span><input type="number" value={structureForm.hra} onChange={(e) => setStructureForm({ ...structureForm, hra: Number(e.target.value) })} /></label>
                  <label className="field"><span>Allowances</span><input type="number" value={structureForm.allowances} onChange={(e) => setStructureForm({ ...structureForm, allowances: Number(e.target.value) })} /></label>
                  <label className="field"><span>Statutory deductions</span><input type="number" value={structureForm.statutoryDeductions} onChange={(e) => setStructureForm({ ...structureForm, statutoryDeductions: Number(e.target.value) })} /></label>
                  <label className="field"><span>Other deductions</span><input type="number" value={structureForm.otherDeductions} onChange={(e) => setStructureForm({ ...structureForm, otherDeductions: Number(e.target.value) })} /></label>
                </div>
                <button className="primary-button" type="submit">Save structure</button>
              </form>

              <div className="sub-card">
                <h4>Run monthly payroll</h4>
                <div className="action-row compact-wrap">
                  <input type="month" value={runMonth} onChange={(e) => setRunMonth(e.target.value)} />
                  <button className="secondary-button" type="button" onClick={runPayroll}>Run payroll</button>
                </div>
              </div>

              <div className="detail-section">
                <h4>Saved salary structures</h4>
                <div className="mini-history-list">
                  {structures.slice(0, 12).map((item) => (
                    <div className="mini-history-item" key={item.id}><div><strong>{item.user?.name}</strong><p>Gross: ₹{(item.basic + item.hra + item.allowances).toLocaleString('en-IN')}</p></div><span>₹{(item.statutoryDeductions + item.otherDeductions).toLocaleString('en-IN')} deductions</span></div>
                  ))}
                  {structures.length === 0 ? <div className="empty-state">No salary structures configured yet.</div> : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">Payslips appear here after payroll is run and marked paid.</div>
          )}
        </article>

        <article className="card detail-card card-elevated">
          <div className="section-header">
            <div>
              <h3>{canManage ? 'Payroll records' : 'Recent payslips'}</h3>
              <p>Net pay includes payroll deductions and linked advance deductions.</p>
            </div>
          </div>
          <div className="list-stack">
            {myLatestPayrolls.map((item) => (
              <div className="request-card" key={item.id}>
                <div className="request-card-top"><div><strong>{item.user?.name || user.name}</strong><p>{item.month}</p></div><span className={`status-chip ${item.status === 'paid' ? 'paid' : 'pending'}`}>{item.status}</span></div>
                <div className="request-grid">
                  <div><span className="muted-label">Gross</span><strong>₹{item.grossPay.toLocaleString('en-IN')}</strong></div>
                  <div><span className="muted-label">Advance deduction</span><strong>₹{item.advanceDeduction.toLocaleString('en-IN')}</strong></div>
                  <div><span className="muted-label">Total deductions</span><strong>₹{item.totalDeductions.toLocaleString('en-IN')}</strong></div>
                  <div><span className="muted-label">Net pay</span><strong>₹{item.netPay.toLocaleString('en-IN')}</strong></div>
                </div>
                {canManage && item.status !== 'paid' ? <div className="action-row"><button className="secondary-button small" type="button" onClick={() => markPaid(item.id)}>Mark paid</button></div> : null}
              </div>
            ))}
            {myLatestPayrolls.length === 0 ? <div className="empty-state">No payroll records yet.</div> : null}
          </div>
        </article>
      </section>
    </AppLayout>
  );
}
