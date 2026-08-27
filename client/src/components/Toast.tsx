import { useEffect, useState } from 'react';

type ToastTone = 'error' | 'success' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

let counter = 0;
const listeners: Array<(items: ToastItem[]) => void> = [];
let items: ToastItem[] = [];

function emit() {
  for (const l of listeners) l(items);
}

export const toast = {
  error: (message: string) => push(message, 'error'),
  success: (message: string) => push(message, 'success'),
  info: (message: string) => push(message, 'info'),
};

function push(message: string, tone: ToastTone) {
  const id = ++counter;
  items = [...items, { id, message, tone }];
  emit();
  setTimeout(() => {
    items = items.filter((i) => i.id !== id);
    emit();
  }, 3200);
}

export function ToastHost() {
  const [current, setCurrent] = useState<ToastItem[]>(items);
  useEffect(() => {
    listeners.push(setCurrent);
    return () => {
      const idx = listeners.indexOf(setCurrent);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);
  return (
    <div className="toast-host" aria-live="polite">
      {current.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
