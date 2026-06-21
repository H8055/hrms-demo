import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);

let _id = 0;

const ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ'
};

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function close() {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 260);
  }

  return (
    <div
      className={`toast toast-${toast.type} ${visible ? 'toast-in' : 'toast-out'}`}
      role="alert"
    >
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <span className="toast-msg">{toast.message}</span>
      <button className="toast-close" onClick={close} aria-label="Dismiss">✕</button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++_id;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    if (duration > 0) {
      timers.current[id] = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        delete timers.current[id];
      }, duration);
    }
    return id;
  }, []);

  const success = useCallback((msg, duration) => show(msg, 'success', duration), [show]);
  const error   = useCallback((msg, duration) => show(msg, 'error',   duration ?? 5000), [show]);
  const warning = useCallback((msg, duration) => show(msg, 'warning', duration), [show]);
  const info    = useCallback((msg, duration) => show(msg, 'info',    duration), [show]);

  return (
    <ToastContext.Provider value={{ toast: show, success, error, warning, info, dismiss }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
