import styles from './FeedFilters.module.css';

/**
 * Sort controls for the feed. Values map directly onto the API's sort
 * parameter.
 */
export const FEED_FILTERS = [
  { value: 'latest', label: 'All Posts' },
  { value: 'foryou', label: 'For You' },
  { value: 'liked', label: 'Most Liked' },
  { value: 'commented', label: 'Most Commented' },
];

export default function FeedFilters({ value, onChange }) {
  return (
    <div className={styles.wrapper} role="tablist" aria-label="Sort the feed">
      {FEED_FILTERS.map((filter) => {
        const active = filter.value === value;
        return (
          <button
            key={filter.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`${styles.pill} ${active ? styles.active : ''}`}
            onClick={() => onChange(filter.value)}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
