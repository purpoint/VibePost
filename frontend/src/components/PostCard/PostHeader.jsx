import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import Avatar from '../Avatar/Avatar.jsx';
import { timeAgo, fullTimestamp } from '../../utils/timeAgo.js';
import styles from './PostCard.module.css';

/**
 * Author identity and the post's own controls.
 * The menu only appears for a post the current user wrote.
 */
export default function PostHeader({ author, createdAt, canDelete, onDelete, deleting }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <Avatar name={author.name} username={author.username} src={author.avatarUrl} size={42} />

      <div className={styles.identity}>
        <p className={styles.name}>{author.name}</p>
        <p className={styles.meta}>
          <span>@{author.username}</span>
          <span aria-hidden="true"> · </span>
          <time dateTime={createdAt} title={fullTimestamp(createdAt)}>
            {timeAgo(createdAt)}
          </time>
        </p>
      </div>

      {canDelete && (
        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Post options"
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className={styles.menu} role="menu">
              <button
                type="button"
                role="menuitem"
                className={styles.deleteItem}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                disabled={deleting}
              >
                <Trash2 size={15} aria-hidden="true" />
                {deleting ? 'Deleting…' : 'Delete post'}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
