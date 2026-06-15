// src/pages/Login.jsx (Complete Redesign)
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

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-blob blob-1"></div>
        <div className="auth-blob blob-2"></div>
        <div className="auth-blob blob-3"></div>
      </div>
      
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span>S</span>
          </div>
          <h1>Social<span>Vibe</span></h1>
          <p>Connect with creators, discover music, and build your community</p>
        </div>
        
        {!showForgotPassword ? (
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
            
            {error && <div className="auth-error">{error}</div>}
            
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? <div className="spinner-small"></div> : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="forgot-password-form">
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
            {resetSent && <div className="auth-success">Reset link sent! Check your email.</div>}
            <button className="auth-btn-primary" onClick={handleResetPassword} disabled={loading}>
              {loading ? <div className="spinner-small"></div> : 'Send Reset Link'}
            </button>
            <button className="auth-link" onClick={() => setShowForgotPassword(false)}>
              Back to Sign In
            </button>
          </div>
        )}
        
        <div className="auth-divider">
          <span>or</span>
        </div>
        
        <button className="auth-btn-google" onClick={handleGoogleLogin}>
          <i className="fab fa-google"></i>
          Continue with Google
        </button>
        
        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register">Sign up</Link>
        </div>
      </div>
      
      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0b2e 100%);
        }
        
        .auth-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }
        
        .auth-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
          animation: float 20s infinite ease-in-out;
        }
        
        .blob-1 {
          width: 400px;
          height: 400px;
          background: #7c3aed;
          top: -100px;
          right: -100px;
        }
        
        .blob-2 {
          width: 500px;
          height: 500px;
          background: #ec4899;
          bottom: -150px;
          left: -150px;
          animation-delay: -5s;
        }
        
        .blob-3 {
          width: 300px;
          height: 300px;
          background: #f59e0b;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -10s;
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .auth-card {
          position: relative;
          z-index: 10;
          background: rgba(20, 20, 30, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          padding: 48px 40px;
          width: 100%;
          max-width: 460px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.6s ease-out;
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .auth-logo {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .auth-logo-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 32px;
          font-weight: bold;
          color: white;
          box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.4);
        }
        
        .auth-logo h1 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
        }
        
        .auth-logo h1 span {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .auth-logo p {
          color: #9ca3af;
          font-size: 14px;
        }
        
        .input-group {
          position: relative;
          margin-bottom: 20px;
        }
        
        .input-group i {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-size: 18px;
        }
        
        .input-group input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: white;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .input-group input:focus {
          outline: none;
          border-color: #7c3aed;
          background: rgba(124, 58, 237, 0.1);
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.2);
        }
        
        .input-group input::placeholder {
          color: #4b5563;
        }
        
        .auth-btn-primary {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }
        
        .auth-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.5);
        }
        
        .auth-btn-primary:disabled {
          opacity: 0.7;
          transform: none;
        }
        
        .auth-btn-google {
          width: 100%;
          padding: 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          color: white;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        .auth-btn-google:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-1px);
        }
        
        .auth-divider {
          text-align: center;
          margin: 24px 0;
          position: relative;
        }
        
        .auth-divider::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          width: calc(50% - 30px);
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .auth-divider::after {
          content: '';
          position: absolute;
          right: 0;
          top: 50%;
          width: calc(50% - 30px);
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .auth-divider span {
          background: rgba(20, 20, 30, 0.8);
          padding: 0 16px;
          color: #6b7280;
          font-size: 14px;
        }
        
        .auth-footer {
          text-align: center;
          margin-top: 24px;
          color: #9ca3af;
        }
        
        .auth-footer a {
          color: #7c3aed;
          text-decoration: none;
          font-weight: 600;
        }
        
        .auth-footer a:hover {
          text-decoration: underline;
        }
        
        .auth-link {
          background: none;
          border: none;
          color: #7c3aed;
          cursor: pointer;
          margin-top: 16px;
          width: 100%;
          text-align: center;
        }
        
        .auth-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 12px;
          color: #f87171;
          font-size: 14px;
          margin-bottom: 16px;
        }
        
        .auth-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
          padding: 12px;
          color: #34d399;
          font-size: 14px;
          margin-bottom: 16px;
        }
        
        .reset-info {
          color: #9ca3af;
          font-size: 14px;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}