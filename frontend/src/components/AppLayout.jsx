import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppLayout({ title, description, eyebrow = 'HRMS Workspace', children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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
          </section>
          {children}
        </main>
      </div>
    </div>
  );
}
