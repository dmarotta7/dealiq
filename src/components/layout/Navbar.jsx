import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogOut, PlusCircle, LayoutDashboard, BookOpen } from 'lucide-react'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-[#0A1628] border-b border-[#1a2a45] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <span className="text-[#B22234] font-black text-2xl tracking-tight">DEAL</span>
              <span className="text-white font-black text-2xl tracking-tight">IQ</span>
            </div>
            <div className="hidden sm:block h-5 w-px bg-gray-600 mx-1" />
            <span className="hidden sm:block text-gray-400 text-xs font-medium tracking-widest uppercase">
              Acquisition Intelligence
            </span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/dashboard') ? 'bg-[#1a2a45] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1a2a45]'}`}
              >
                <LayoutDashboard size={15} />
                <span className="hidden sm:block">Dashboard</span>
              </Link>
              <Link
                to="/glossary"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/glossary') ? 'bg-[#1a2a45] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1a2a45]'}`}
              >
                <BookOpen size={15} />
                <span className="hidden sm:block">Glossary</span>
              </Link>
              <Link
                to="/evaluate"
                className="flex items-center gap-1.5 bg-[#B22234] hover:bg-[#8f1b2a] text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <PlusCircle size={15} />
                <span>New Deal</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1a2a45] transition-colors"
              >
                <LogOut size={15} />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Sign in</Link>
              <Link to="/signup" className="bg-[#B22234] hover:bg-[#8f1b2a] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Get started</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
