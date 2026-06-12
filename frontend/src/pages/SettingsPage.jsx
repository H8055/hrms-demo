import { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { api } from '../api/client';

const initialForm = {
  companyName: '',
  companyEmail: '',
  companyPhone: '',
  logoUrl: '',
  address: '',
  leaveTypes: 'annual, sick, casual, unpaid',
  holidays: ''
};

export default function SettingsPage() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await api.get('/settings');
        const settings = data.settings;
        setForm({
          companyName: settings.companyName || '',
          companyEmail: settings.companyEmail || '',
          companyPhone: settings.companyPhone || '',
          logoUrl: settings.logoUrl || '',
          address: settings.address || '',
          leaveTypes: (settings.leaveTypes || []).join(', '),
          holidays: (settings.holidays || []).join('\n')
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await api.put('/settings', {
        ...form,
        leaveTypes: form.leaveTypes.split(',').map((item) => item.trim()).filter(Boolean),
        holidays: form.holidays.split('\n').map((item) => item.trim()).filter(Boolean)
      });
      setMessage('Settings saved successfully.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    }
  }

  return (
    <AppLayout title="Company Settings" description="Sprint foundation support: company details, leave types, and holiday configuration.">
      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}
      {loading ? <div className="empty-state">Loading settings...</div> : (
        <section className="single-column-layout">
          <form className="card detail-stack" onSubmit={submit}>
            <div className="detail-grid">
              <label className="field"><span>Company name</span><input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} /></label>
              <label className="field"><span>Company email</span><input type="email" value={form.companyEmail} onChange={(e) => setForm({ ...form, companyEmail: e.target.value })} /></label>
              <label className="field"><span>Company phone</span><input value={form.companyPhone} onChange={(e) => setForm({ ...form, companyPhone: e.target.value })} /></label>
              <label className="field"><span>Logo URL</span><input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} /></label>
            </div>
            <label className="field"><span>Address</span><textarea rows="3" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label className="field"><span>Leave types (comma separated)</span><input value={form.leaveTypes} onChange={(e) => setForm({ ...form, leaveTypes: e.target.value })} /></label>
            <label className="field"><span>Holidays (one per line)</span><textarea rows="5" value={form.holidays} onChange={(e) => setForm({ ...form, holidays: e.target.value })} /></label>
            <button className="primary-button" type="submit">Save settings</button>
          </form>
        </section>
      )}
    </AppLayout>
  );
}
