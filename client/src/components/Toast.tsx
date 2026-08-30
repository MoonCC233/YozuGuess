import { useEffect } from 'react';

interface Props {
  message: string | null;
  onDismiss: () => void;
}

/** 轻量提示条，3 秒后自动消失 */
export function Toast({ message, onDismiss }: Props) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 3000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
