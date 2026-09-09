import styles from './PostCard.module.css';

/**
 * The post's text. Whitespace is preserved so line breaks the author typed
 * survive, and long unbroken strings wrap instead of stretching the card.
 */
export default function PostContent({ text }) {
  if (!text) return null;

  return <p className={styles.text}>{text}</p>;
}
