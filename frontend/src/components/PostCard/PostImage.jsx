import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import styles from './PostCard.module.css';

/**
 * A post's image, with its own loading and failure states so a slow or dead
 * URL never leaves a blank gap in the feed.
 */
export default function PostImage({ src, authorName }) {
  const [status, setStatus] = useState('loading');

  if (!src) return null;

  if (status === 'error') {
    return (
      <div className={styles.imageFallback}>
        <ImageOff size={18} aria-hidden="true" />
        <span>Image unavailable</span>
      </div>
    );
  }

  return (
    <div className={styles.imageFrame}>
      {status === 'loading' && <span className={styles.imageLoading} aria-hidden="true" />}
      <img
        className={styles.image}
        src={src}
        alt={`Image shared by ${authorName}`}
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </div>
  );
}
