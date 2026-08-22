import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { LoadingScreen } from './components/LoadingScreen'
import './styles.css'

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  return user ? <DashboardPage /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3200,
          className: 'app-toast',
        }}
      />
    </AuthProvider>
  )
}
