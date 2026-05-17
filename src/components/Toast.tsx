import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (t: ToastItem) => void;
const listeners: Listener[] = [];

export function showToast(message: string, type: ToastType = 'success') {
  const item: ToastItem = { id: Math.random().toString(36).slice(2), message, type };
  listeners.forEach((fn) => fn(item));
}

export function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const fn: Listener = (item) => {
      setToasts((ts) => [...ts, item]);
      setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== item.id)), 2800);
    };
    listeners.push(fn);
    return () => {
      listeners.splice(listeners.indexOf(fn), 1);
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && '✓ '}
          {t.type === 'error' && '✕ '}
          {t.type === 'info' && '◈ '}
          {t.message}
        </div>
      ))}
    </div>
  );
}
