// src/pages/Login.jsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
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
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email address')
      return
    }
    
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  if (showForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="circle-logo">S</div>
            <h1>Reset Password</h1>
          </div>
          
          {resetSent ? (
            <>
              <div className="auth-success">Check your email for a reset link!</div>
              <button className="auth-btn-primary" onClick={() => setShowForgotPassword(false)}>
                Back to Login
              </button>
            </>
          ) : (
            <>
              <p className="reset-info">Enter your email and we'll send you a link to reset your password.</p>
              <div className="input-group">
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  placeholder="Email address" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button className="auth-btn-primary" onClick={handleResetPassword} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button className="auth-link" onClick={() => setShowForgotPassword(false)}>
                Back to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="circle-logo">S</div>
          <h1>Social<span>Vibe</span></h1>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <i className="fas fa-envelope"></i>
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <i className="fas fa-lock"></i>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="auth-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <button type="button" className="forgot-link" onClick={() => setShowForgotPassword(true)}>
              Forgot password?
            </button>
          </div>
          
          {error && <div className="auth-error">{error}</div>}
          
          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>or</span>
        </div>
        
        <button className="auth-btn-google" onClick={handleGoogleLogin}>
          <i className="fab fa-google"></i>
          Continue with Google
        </button>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>

      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-color: #f0f2f5;
        }
        
        .auth-card {
          background: white;
          border-radius: 16px;
          padding: 40px 36px;
          width: 100%;
          max-width: 440px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .auth-logo {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .circle-logo {
          width: 48px;
          height: 48px;
          background: #000;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 22px;
          font-weight: bold;
          margin: 0 auto 12px;
        }
        
        .auth-logo h1 {
          font-size: 24px;
          font-weight: bold;
          color: #000;
        }
        
        .auth-logo h1 span {
          color: #000;
        }
        
        .input-group {
          position: relative;
          margin-bottom: 16px;
        }
        
        .input-group i {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #666;
          font-size: 14px;
        }
        
        .input-group input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: #f0f2f5;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          transition: all 0.2s;
        }
        
        .input-group input:focus {
          outline: none;
          border-color: #000;
          background: white;
        }
        
        .auth-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          font-size: 13px;
        }
        
        .remember-me {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #666;
          cursor: pointer;
          font-weight: bold;
        }
        
        .forgot-link {
          background: none;
          border: none;
          color: #000;
          cursor: pointer;
          font-weight: bold;
          font-size: 13px;
        }
        
        .forgot-link:hover {
          text-decoration: underline;
        }
        
        .auth-btn-primary {
          width: 100%;
          padding: 14px;
          background: #000;
          color: white;
          border: none;
          border-radius: 40px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .auth-btn-primary:hover {
          background: #333;
        }
        
        .auth-btn-primary:disabled {
          opacity: 0.7;
        }
        
        .auth-btn-google {
          width: 100%;
          padding: 12px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 40px;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }
        
        .auth-btn-google:hover {
          background: #f0f2f5;
        }
        
        .auth-divider {
          text-align: center;
          margin: 24px 0;
          position: relative;
        }
        
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: calc(50% - 40px);
          height: 1px;
          background: #ddd;
        }
        
        .auth-divider::before {
          left: 0;
        }
        
        .auth-divider::after {
          right: 0;
        }
        
        .auth-divider span {
          background: white;
          padding: 0 16px;
          color: #666;
          font-size: 13px;
        }
        
        .auth-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #666;
        }
        
        .auth-footer a {
          color: #000;
          text-decoration: none;
          font-weight: bold;
        }
        
        .auth-footer a:hover {
          text-decoration: underline;
        }
        
        .auth-error {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 16px;
          color: #c00;
          font-size: 13px;
          text-align: center;
        }
        
        .auth-success {
          background: #efe;
          border: 1px solid #cfc;
          border-radius: 8px;
          padding: 10px;
          margin-bottom: 16px;
          color: #0a0;
          font-size: 13px;
          text-align: center;
        }
        
        .reset-info {
          color: #666;
          font-size: 13px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .auth-link {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          margin-top: 16px;
          width: 100%;
          text-align: center;
          font-size: 13px;
        }
        
        .auth-link:hover {
          color: #000;
        }
      `}</style>
    </div>
  )
}