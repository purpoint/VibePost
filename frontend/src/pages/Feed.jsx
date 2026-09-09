import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button/Button.jsx';

/**
 * Placeholder feed. The real layout, composer and post cards arrive in the
 * feed-UI milestone; for now this proves the authenticated session works.
 */
export default function Feed() {
  const { user, logout } = useAuth();

  return (
    <main
      style={{
        maxWidth: 'var(--feed-max-width)',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
      }}
    >
      <h1 style={{ fontSize: '28px', letterSpacing: '-0.02em' }}>VibePost</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Share. Connect. Engage.</p>

      <div
        style={{
          marginBlockStart: 'var(--space-6)',
          padding: 'var(--space-5)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <p>
          Signed in as <strong>{user?.name}</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>@{user?.username}</span>
        </p>
        <div style={{ marginBlockStart: 'var(--space-4)' }}>
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    </main>
  );
}
