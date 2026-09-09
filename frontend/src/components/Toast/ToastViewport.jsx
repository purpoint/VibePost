import { X, CircleAlert, CircleCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';
import styles from './ToastViewport.module.css';

/**
 * Renders the active toasts. Mounted once, near the root.
 */
export default function ToastViewport() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.viewport} role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const Icon = toast.variant === 'success' ? CircleCheck : CircleAlert;
        return (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.variant]}`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            <Icon size={18} className={styles.icon} aria-hidden="true" />
            <p className={styles.message}>{toast.message}</p>
            <button
              type="button"
              className={styles.close}
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
