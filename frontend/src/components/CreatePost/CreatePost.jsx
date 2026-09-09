import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Send, Smile, X } from 'lucide-react';
import Avatar from '../Avatar/Avatar.jsx';
import Button from '../Button/Button.jsx';
import EmojiPicker from './EmojiPicker.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { postsApi } from '../../services/api.js';
import styles from './CreatePost.module.css';

const MAX_TEXT_LENGTH = 1000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * The post composer.
 *
 * Mirrors the API's rules locally — a post needs text or an image, images are
 * capped at 5MB — so mistakes are caught before a request is sent. The server
 * remains the authority.
 */
export default function CreatePost({ onCreated }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className={styles.signedOut}>
        <p className={styles.signedOutText}>
          <Link to="/login">Log in</Link> to share something on VibePost.
        </p>
      </div>
    );
  }

  const canSubmit = Boolean(text.trim() || image) && !submitting;

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setImage(null);
    setPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WEBP and GIF images are supported');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be 5MB or smaller');
      event.target.value = '';
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  }

  function insertEmoji(emoji) {
    setText((current) => (current + emoji).slice(0, MAX_TEXT_LENGTH));
    setEmojiOpen(false);
    textareaRef.current?.focus();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError('');
    try {
      const { post } = await postsApi.create({ text: text.trim(), imageFile: image });
      onCreated(post);
      setText('');
      clearImage();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={handleSubmit}>
      <div className={styles.head}>
        <Avatar name={user.name} username={user.username} src={user.avatarUrl} size={40} />
        <h2 className={styles.title}>Create Post</h2>
      </div>

      <label className="visually-hidden" htmlFor="composer">
        What&apos;s on your mind?
      </label>
      <textarea
        id="composer"
        ref={textareaRef}
        className={styles.textarea}
        placeholder="What's on your mind?"
        value={text}
        maxLength={MAX_TEXT_LENGTH}
        rows={3}
        disabled={submitting}
        onChange={(event) => {
          setText(event.target.value);
          setError('');
        }}
      />

      {preview && (
        <div className={styles.previewFrame}>
          <img className={styles.preview} src={preview} alt="Selected attachment preview" />
          <button
            type="button"
            className={styles.removeImage}
            onClick={clearImage}
            aria-label="Remove selected image"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.footer}>
        <div className={styles.tools}>
          <input
            ref={fileInputRef}
            type="file"
            className="visually-hidden"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileChange}
            id="post-image"
          />
          <button
            type="button"
            className={styles.tool}
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            aria-label="Add an image"
          >
            <ImagePlus size={19} aria-hidden="true" />
          </button>

          <div className={styles.emojiWrapper}>
            <button
              type="button"
              className={styles.tool}
              onClick={() => setEmojiOpen((open) => !open)}
              disabled={submitting}
              aria-haspopup="dialog"
              aria-expanded={emojiOpen}
              aria-label="Add an emoji"
            >
              <Smile size={19} aria-hidden="true" />
            </button>
            {emojiOpen && <EmojiPicker onSelect={insertEmoji} onClose={() => setEmojiOpen(false)} />}
          </div>

          {text.length > MAX_TEXT_LENGTH - 100 && (
            <span className={styles.counter} aria-live="polite">
              {MAX_TEXT_LENGTH - text.length} left
            </span>
          )}
        </div>

        <Button type="submit" loading={submitting} disabled={!canSubmit}>
          {!submitting && <Send size={16} aria-hidden="true" />}
          {submitting ? 'Posting…' : 'Post'}
        </Button>
      </div>
    </form>
  );
}
