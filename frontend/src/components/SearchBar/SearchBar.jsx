import { Search, X } from 'lucide-react';
import styles from './SearchBar.module.css';

/**
 * Feed search input.
 *
 * Submitting runs the search; live debounced searching arrives with the rest of
 * the feed controls in a later milestone.
 */
export default function SearchBar({ value, onChange, onSubmit, onClear }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className={styles.wrapper} onSubmit={handleSubmit} role="search">
      {/* A real submit button, so the magnifier is clickable and pressing
          Enter in the field submits the form. */}
      <button type="submit" className={styles.submit} aria-label="Search">
        <Search size={18} aria-hidden="true" />
      </button>

      <input
        type="search"
        className={styles.input}
        placeholder="Search users, posts..."
        aria-label="Search users and posts"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      {value && (
        <button type="button" className={styles.clear} onClick={onClear} aria-label="Clear search">
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </form>
  );
}
