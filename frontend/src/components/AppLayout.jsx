import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';

export default function AppLayout({ title, description, eyebrow, children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-main">
        <Topbar onMenuClick={() => setSidebarOpen((prev) => !prev)} title={title} />
        <main className="content-area">
          {(title || description) && (
            <div className="page-heading-block">
              {eyebrow && <span className="page-eyebrow">{eyebrow}</span>}
              {title && <h2 className="page-title">{title}</h2>}
              {description && <p className="page-desc">{description}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
