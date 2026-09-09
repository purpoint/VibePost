import { Heart, MessageCircle } from 'lucide-react';
import styles from './PostCard.module.css';

/**
 * Like and comment controls.
 *
 * The counts and liked state come from the API. The buttons carry the
 * authentication gate, so a logged-out visitor is sent to log in.
 */
export default function PostActions({ likeCount, commentCount, likedByMe, onLike, onComment }) {
  return (
    <footer className={styles.actions}>
      <button
        type="button"
        className={`${styles.action} ${likedByMe ? styles.liked : ''}`}
        onClick={onLike}
        aria-pressed={likedByMe}
        aria-label={likedByMe ? 'Unlike this post' : 'Like this post'}
      >
        <Heart size={18} aria-hidden="true" fill={likedByMe ? 'currentColor' : 'none'} />
        <span className={styles.count}>{likeCount}</span>
      </button>

      <button
        type="button"
        className={styles.action}
        onClick={onComment}
        aria-label={`Comments (${commentCount})`}
      >
        <MessageCircle size={18} aria-hidden="true" />
        <span className={styles.count}>{commentCount}</span>
      </button>
    </footer>
  );
}
