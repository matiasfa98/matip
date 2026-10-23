import { useEffect } from 'react';

function Toast({ id, type = 'info', message, onClose, duration = 3500 }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(t);
  }, [id, duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-dot" />
      <span className="toast-msg">{message}</span>
    </div>
  );
}

export default function ToastStack({ toasts, onClose }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => <Toast key={t.id} {...t} onClose={onClose} />)}
    </div>
  );
}