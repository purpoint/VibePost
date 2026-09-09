import { initialsFrom, avatarHue } from '../../utils/avatar.js';
import styles from './Avatar.module.css';

/**
 * Circular avatar. Falls back to the user's initials on a colour derived from
 * their username, so every account has a recognisable identity without needing
 * an uploaded picture.
 */
export default function Avatar({ name, username, src, size = 40 }) {
  const hue = avatarHue(username ?? '');

  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.36),
    '--avatar-bg': `hsl(${hue} 58% 32%)`,
    '--avatar-fg': `hsl(${hue} 85% 88%)`,
  };

  if (src) {
    return (
      <img
        className={styles.avatar}
        style={style}
        src={src}
        alt={name ? `${name}'s avatar` : 'User avatar'}
      />
    );
  }

  return (
    <span className={styles.avatar} style={style} aria-hidden="true">
      {initialsFrom(name, username)}
    </span>
  );
}
