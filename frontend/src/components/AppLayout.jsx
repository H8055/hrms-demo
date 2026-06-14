import { useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ title, description, eyebrow = 'HRMS Workspace', children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const headingMeta = useMemo(
    () => [
      { label: 'Responsive', value: 'Mobile · Tablet · Desktop' },
      { label: 'Status', value: 'Implementation in progress' }
    ],
    []
  );

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className="content-area">
          <section className="page-heading page-heading-card">
            <div className="page-heading-main">
              <span className="page-eyebrow">{eyebrow}</span>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <div className="page-heading-meta">
              {headingMeta.map((item) => (
                <div className="page-meta-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}
