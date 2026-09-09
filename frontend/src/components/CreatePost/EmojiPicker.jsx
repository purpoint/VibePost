import { useEffect, useRef } from 'react';
import styles from './CreatePost.module.css';

const EMOJI = [
  '😀', '😂', '🥹', '😍', '🤔', '😎', '🥳', '😴',
  '👍', '🙌', '👏', '🙏', '💪', '🤝', '✌️', '🫶',
  '🔥', '✨', '🚀', '💡', '🎉', '❤️', '💯', '⭐',
  '☕', '🍕', '🌧️', '🌈', '🐶', '🐱', '📚', '🎧',
];

/**
 * A small fixed palette rather than a picker dependency — enough to add
 * personality to a post without pulling in an emoji database.
 */
export default function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!ref.current?.contains(event.target)) onClose();
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className={styles.emojiPanel} ref={ref} role="dialog" aria-label="Choose an emoji">
      {EMOJI.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className={styles.emoji}
          onClick={() => onSelect(emoji)}
          aria-label={`Add ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
