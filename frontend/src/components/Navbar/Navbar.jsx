import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import Avatar from '../Avatar/Avatar.jsx';
import ThemeToggle from '../ThemeToggle/ThemeToggle.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Navbar.module.css';

/**
 * Application header: the VibePost wordmark and, depending on the session,
 * either an account menu or a link to log in.
 */
export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the menu on an outside click or Escape, the way a menu is expected
  // to behave.
  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* The wordmark is the page's h1: every other heading on the feed
            sits beneath it. */}
        <h1 className={styles.brandHeading}>
          <Link to="/feed" className={styles.brand}>
            <span className={styles.logo}>VibePost</span>
            <span className={styles.tagline}>Share. Connect. Engage.</span>
          </Link>
        </h1>

        <div className={styles.controls}>
          <ThemeToggle />

          {isAuthenticated ? (
            <div className={styles.account} ref={menuRef}>
              <button
                type="button"
                className={styles.avatarButton}
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
              >
                <Avatar name={user.name} username={user.username} src={user.avatarUrl} size={38} />
              </button>

              {menuOpen && (
                <div className={styles.menu} role="menu">
                  <div className={styles.identity}>
                    <User size={15} aria-hidden="true" />
                    <div>
                      <p className={styles.name}>{user.name}</p>
                      <p className={styles.username}>@{user.username}</p>
                    </div>
                  </div>

                  <button type="button" className={styles.menuItem} role="menuitem" onClick={logout}>
                    <LogOut size={15} aria-hidden="true" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className={styles.loginLink}>
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
