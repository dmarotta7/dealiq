import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'
import Landing from './pages/Landing'
import { Login, Signup } from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Evaluate from './pages/Evaluate'
import DealResults from './pages/DealResults'
import Glossary from './pages/Glossary'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-8 h-8 border-4 border-[#0A1628] border-t-[#B22234] rounded-full animate-spin" />
    </div>
  )
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <Signup />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/evaluate" element={<ProtectedRoute><Evaluate /></ProtectedRoute>} />
        <Route path="/deal/:id" element={<ProtectedRoute><DealResults /></ProtectedRoute>} />
        <Route path="/glossary" element={<Glossary />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error: { iconTheme: { primary: '#B22234', secondary: '#fff' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  )
}
