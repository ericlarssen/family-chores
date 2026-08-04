import AuthGate from './components/AuthGate'
import WeekView from './views/WeekView'

function App() {
  return (
    <AuthGate>
      {({ profile, signOut }) => (
        <WeekView profile={profile} onSignOut={signOut} />
      )}
    </AuthGate>
  )
}

export default App
