import { useId } from 'react';
import styles from './FormField.module.css';

/**
 * Labelled input with inline validation feedback.
 * The error is linked through aria-describedby and announced politely, so
 * screen-reader users hear it without losing their place in the form.
 */
export default function FormField({ label, error, hint, type = 'text', ...rest }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={`${styles.input} ${error ? styles.invalid : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        {...rest}
      />
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
