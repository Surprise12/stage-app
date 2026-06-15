import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="container" style={{ maxWidth: '450px', marginTop: '80px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>Welcome Back</h1>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: '16px' }}
          />
          <input
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: '24px' }}
          />
          {error && <p style={{ color: '#ff5f6d', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <button onClick={handleGoogleLogin} className="btn btn-secondary" style={{ width: '100%', marginTop: '12px' }}>
          Continue with Google
        </button>
        <p style={{ textAlign: 'center', marginTop: '24px', color: '#888' }}>
          Don't have an account? <Link to="/register" style={{ color: '#ff5f6d' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}