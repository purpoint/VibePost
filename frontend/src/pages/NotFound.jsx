import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <main className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.text}>The page you are looking for does not exist.</p>
      <Link to="/feed" className={styles.link}>
        Back to the feed
      </Link>
    </main>
  );
}
