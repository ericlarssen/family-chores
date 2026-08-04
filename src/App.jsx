import AuthGate from './components/AuthGate'
import Home from './views/Home'

function App() {
  return (
    <AuthGate>
      {({ profile, signOut }) => <Home profile={profile} onSignOut={signOut} />}
    </AuthGate>
  )
}

export default App
