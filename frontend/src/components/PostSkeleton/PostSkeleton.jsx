import styles from './PostSkeleton.module.css';

/**
 * Placeholder shown while the feed loads, shaped like a real post card so the
 * layout does not jump when the content arrives.
 */
export default function PostSkeleton() {
  return (
    <article className={styles.card} aria-hidden="true">
      <div className={styles.header}>
        <span className={`${styles.shimmer} ${styles.avatar}`} />
        <div className={styles.headerText}>
          <span className={`${styles.shimmer} ${styles.name}`} />
          <span className={`${styles.shimmer} ${styles.meta}`} />
        </div>
      </div>

      <span className={`${styles.shimmer} ${styles.line}`} />
      <span className={`${styles.shimmer} ${styles.lineShort}`} />

      <div className={styles.footer}>
        <span className={`${styles.shimmer} ${styles.action}`} />
        <span className={`${styles.shimmer} ${styles.action}`} />
      </div>
    </article>
  );
}
