import styles from './EmptyState.module.css';

/**
 * Shared presentation for the feed's empty and error states.
 */
export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className={styles.wrapper}>
      {Icon && (
        <span className={styles.icon} aria-hidden="true">
          <Icon size={22} />
        </span>
      )}
      <h2 className={styles.title}>{title}</h2>
      {message && <p className={styles.message}>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
