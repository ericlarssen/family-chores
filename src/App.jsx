import AuthGate from './components/AuthGate'

function App() {
  return (
    <AuthGate>
      {({ profile, signOut }) => (
        <div className="app-shell">
          <h1>You're in</h1>
          <p>
            Signed in as {profile.displayName || profile.email} ·{' '}
            <strong>{profile.role}</strong> ({profile.personId})
          </p>
          <p className="auth-muted">The week view lands in M3.</p>
          <button type="button" className="auth-btn auth-btn--ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </AuthGate>
  )
}

export default App
