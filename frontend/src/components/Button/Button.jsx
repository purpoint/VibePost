import styles from './Button.module.css';

/**
 * Primary action button with a built-in loading state.
 * Disabled while loading so a form cannot be submitted twice.
 */
export default function Button({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
