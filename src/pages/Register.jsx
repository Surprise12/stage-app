import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username }
      }
    })

    if (error) {
      setError(error.message)
    } else {
      alert('Check your email to confirm your account!')
      navigate('/login')
    }
    setLoading(false)
  }

  return (
    <div className="container" style={{ maxWidth: '450px', marginTop: '80px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>Join Stage</h1>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ marginBottom: '16px' }}
          />
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
            placeholder="Password (min 6 characters)"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ marginBottom: '24px' }}
          />
          {error && <p style={{ color: '#ff5f6d', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '24px', color: '#888' }}>
          Already have an account? <Link to="/login" style={{ color: '#ff5f6d' }}>Login</Link>
        </p>
      </div>
    </div>
  )
}