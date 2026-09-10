import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import styles from './ThemeToggle.module.css';

/**
 * Switches between the dark and light palettes.
 *
 * The icon shows the theme you would switch to, which is what the label
 * announces as well, so the button reads the same to a screen reader as it
 * looks to everyone else.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const switchingToLight = theme === 'dark';

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={switchingToLight ? 'Switch to light theme' : 'Switch to dark theme'}
      title={switchingToLight ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {switchingToLight ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}
