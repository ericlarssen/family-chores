import { useAuth } from '../data/useAuth'

// Gates the whole app on Google sign-in + allowlist membership.
//   signed out      → one Google button
//   not allowlisted → a plain "ask to be added" message
//   allowlisted     → children, rendered with the resolved profile + signOut
export default function AuthGate({ children }) {
  const { status, user, profile, signIn, signOut } = useAuth()

  if (status === 'loading') {
    return (
      <div className="auth-gate">
        <p className="auth-muted">Loading…</p>
      </div>
    )
  }

  if (status === 'signed-out') {
    return (
      <div className="auth-gate">
        <h1>Family Chores</h1>
        <p className="auth-muted">Sign in to see this week.</p>
        <button type="button" className="auth-btn" onClick={signIn}>
          Sign in with Google
        </button>
      </div>
    )
  }

  if (status === 'not-allowed') {
    return (
      <div className="auth-gate">
        <h1>Not on the list yet</h1>
        <p className="auth-muted">
          You're signed in as <strong>{user?.email}</strong>, but this account
          hasn't been added to the household. Ask an admin to add you, then sign
          in again.
        </p>
        <button type="button" className="auth-btn auth-btn--ghost" onClick={signOut}>
          Sign out
        </button>
      </div>
    )
  }

  // status === 'allowed'
  return children({ profile, user, signOut })
}
