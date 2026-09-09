import styles from './Loader.module.css';

/**
 * Full-height spinner used while the app resolves the current session.
 */
export default function Loader({ label = 'Loading' }) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}
