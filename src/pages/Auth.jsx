import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

function AuthForm({ mode }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then sign in.')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-[#B22234] font-black text-3xl tracking-tight">DEAL</span>
            <span className="text-[#0A1628] font-black text-3xl tracking-tight">IQ</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'Create your free account'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-200">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                  minLength={mode === 'signup' ? 8 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B22234] hover:bg-[#8f1b2a] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors mt-2"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {mode === 'login' ? (
              <>Don't have an account? <Link to="/signup" className="text-[#B22234] font-semibold hover:underline">Sign up free</Link></>
            ) : (
              <>Already have an account? <Link to="/login" className="text-[#B22234] font-semibold hover:underline">Sign in</Link></>
            )}
          </p>
        </div>

        {mode === 'signup' && (
          <p className="text-center text-xs text-gray-400 mt-4">
            By signing up you agree to our Terms of Service and Privacy Policy.
            Start with 3 free evaluations — no credit card required.
          </p>
        )}
      </div>
    </div>
  )
}

export function Login() { return <AuthForm mode="login" /> }
export function Signup() { return <AuthForm mode="signup" /> }
