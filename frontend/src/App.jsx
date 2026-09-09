/**
 * Application shell.
 * Routing, providers and pages are wired up in a later milestone.
 */
export default function App() {
  return (
    <main
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: '100vh',
        padding: 'var(--space-6)',
        textAlign: 'center',
      }}
    >
      <div>
        <h1 style={{ fontSize: '32px', letterSpacing: '-0.02em' }}>VibePost</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Share. Connect. Engage.
        </p>
      </div>
    </main>
  );
}
