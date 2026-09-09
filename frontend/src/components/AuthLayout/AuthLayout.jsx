import styles from './AuthLayout.module.css';

/**
 * Centred card used by both authentication screens.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <header className={styles.brand}>
          <h1 className={styles.logo}>VibePost</h1>
          <p className={styles.tagline}>Share. Connect. Engage.</p>
        </header>

        <div className={styles.intro}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>

        {children}

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </main>
  );
}
