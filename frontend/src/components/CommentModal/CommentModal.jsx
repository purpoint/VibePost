import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, X } from 'lucide-react';
import Avatar from '../Avatar/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { postsApi } from '../../services/api.js';
import { timeAgo, fullTimestamp } from '../../utils/timeAgo.js';
import styles from './CommentModal.module.css';

const MAX_COMMENT_LENGTH = 500;

/**
 * Comments for a single post.
 *
 * A centred dialog on desktop and a bottom sheet on mobile, matching the
 * design spec. Comments are fetched when it opens rather than shipped with
 * every feed response, which keeps the feed payload small.
 */
export default function CommentModal({ post, onClose, onCountChange }) {
  const [comments, setComments] = useState([]);
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  const load = useCallback(async () => {
    setStatus('loading');
    setLoadError('');
    try {
      const { comments: loaded, commentCount } = await postsApi.listComments(post._id);
      setComments(loaded);
      onCountChange(post._id, commentCount);
      setStatus('ready');
    } catch (error) {
      setLoadError(error.message);
      setStatus('error');
    }
  }, [post._id, onCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  // Close on Escape, keep focus inside the dialog, and stop the page behind
  // it from scrolling.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll(
        'button:not(:disabled), textarea, input, a[href]'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    inputRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setSubmitError('');
    try {
      const { comment, commentCount } = await postsApi.addComment(post._id, trimmed);
      // The new comment appears straight away, without refetching the list.
      setComments((current) => [comment, ...current]);
      onCountChange(post._id, commentCount);
      setText('');
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  function renderBody() {
    if (status === 'loading') {
      return (
        <div className={styles.state} role="status">
          <span className={styles.spinner} aria-hidden="true" />
          <p>Loading comments…</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className={styles.state}>
          <p className={styles.stateTitle}>Couldn&apos;t load comments</p>
          <p className={styles.stateText}>{loadError}</p>
          <button type="button" className={styles.retry} onClick={load}>
            Try again
          </button>
        </div>
      );
    }

    if (comments.length === 0) {
      return (
        <div className={styles.state}>
          <MessageCircle size={22} className={styles.stateIcon} aria-hidden="true" />
          <p className={styles.stateTitle}>No comments yet</p>
          <p className={styles.stateText}>Be the first to say something.</p>
        </div>
      );
    }

    return (
      <ul className={styles.list}>
        {comments.map((comment) => (
          <li key={comment._id} className={styles.comment}>
            <Avatar username={comment.username} name={comment.username} size={34} />
            <div className={styles.commentBody}>
              <p className={styles.commentMeta}>
                <span className={styles.commentAuthor}>@{comment.username}</span>
                <time dateTime={comment.createdAt} title={fullTimestamp(comment.createdAt)}>
                  {timeAgo(comment.createdAt)}
                </time>
              </p>
              <p className={styles.commentText}>{comment.text}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Comments on ${post.author.name}'s post`}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Comments</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close comments">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.scroll}>{renderBody()}</div>

        {isAuthenticated ? (
          <form className={styles.composer} onSubmit={handleSubmit}>
            {submitError && (
              <p className={styles.submitError} role="alert">
                {submitError}
              </p>
            )}

            <div className={styles.composerRow}>
              <Avatar name={user.name} username={user.username} src={user.avatarUrl} size={34} />

              <label className="visually-hidden" htmlFor="comment-input">
                Write a comment
              </label>
              <input
                id="comment-input"
                ref={inputRef}
                className={styles.input}
                placeholder="Write a comment..."
                value={text}
                maxLength={MAX_COMMENT_LENGTH}
                disabled={submitting}
                onChange={(event) => {
                  setText(event.target.value);
                  setSubmitError('');
                }}
              />

              <button
                type="submit"
                className={styles.send}
                disabled={!text.trim() || submitting}
                aria-label="Post comment"
              >
                <Send size={17} aria-hidden="true" />
              </button>
            </div>
          </form>
        ) : (
          <p className={styles.signedOut}>
            <Link to="/login">Log in</Link> to join the conversation.
          </p>
        )}
      </div>
    </div>
  );
}
