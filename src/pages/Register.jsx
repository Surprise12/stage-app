// src/pages/Register.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAppLoading, setIsAppLoading] = useState(true)
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationFrameId
    let particles = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 3 + 1
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.2
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
        ctx.fill()
      }
    }

    const initParticles = () => {
      particles = []
      const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000))
      for (let i = 0; i < count; i++) {
        particles.push(new Particle())
      }
    }

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 150) {
            const opacity = (1 - distance / 150) * 0.3
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })
      
      connectParticles()
      animationFrameId = requestAnimationFrame(animate)
    }

    resizeCanvas()
    initParticles()
    animate()

    window.addEventListener('resize', () => {
      resizeCanvas()
      initParticles()
    })

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // App loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate username
    if (username.length < 3) {
      setError('Username must be at least 3 characters long')
      setLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          username, 
          display_name: username
        }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Show success and navigate
      setLoading(false)
      alert('🎉 Check your email to confirm your account!')
      navigate('/login')
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: window.location.origin }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleMicrosoftLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: window.location.origin }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  // App Loading Screen
  if (isAppLoading) {
    return (
      <div className="app-loader">
        <canvas ref={canvasRef} className="loader-canvas" />
        <div className="loader-overlay">
          <div className="loader-container">
            <div className="loader-ring">
              <div className="ring"></div>
              <div className="ring"></div>
              <div className="ring"></div>
              <div className="ring"></div>
            </div>
            <div className="loader-content">
              <div className="loader-logo">
                Social<span>Vibe</span>
              </div>
              <div className="loader-progress">
                <div className="progress-bar"></div>
              </div>
              <div className="loader-text">Setting up your experience...</div>
            </div>
          </div>
        </div>

        <style>{`
          .app-loader {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            animation: fadeOut 0.8s ease-in-out forwards;
            animation-delay: 2s;
          }

          .loader-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .loader-overlay {
            position: relative;
            z-index: 2;
          }

          @keyframes fadeOut {
            to {
              opacity: 0;
              visibility: hidden;
            }
          }

          .loader-container {
            text-align: center;
          }

          .loader-ring {
            position: relative;
            width: 120px;
            height: 120px;
            margin: 0 auto 30px;
          }

          .ring {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            border: 3px solid transparent;
          }

          .ring:nth-child(1) {
            border-top-color: #7c3aed;
            animation: spin 1.2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          }

          .ring:nth-child(2) {
            border-right-color: #ec4899;
            animation: spin 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite reverse;
          }

          .ring:nth-child(3) {
            border-bottom-color: #3b82f6;
            animation: spin 1.6s cubic-bezier(0.65, 0, 0.35, 1) infinite;
          }

          .ring:nth-child(4) {
            border-left-color: #8b5cf6;
            animation: spin 1.8s cubic-bezier(0.65, 0, 0.35, 1) infinite reverse;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loader-logo {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #fff;
            margin-bottom: 20px;
          }

          .loader-logo span {
            background: linear-gradient(135deg, #7c3aed, #ec4899);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }

          .loader-progress {
            width: 200px;
            height: 3px;
            background: rgba(255,255,255,0.1);
            border-radius: 3px;
            overflow: hidden;
            margin: 0 auto;
          }

          .progress-bar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #7c3aed, #ec4899, #7c3aed);
            background-size: 200% 100%;
            border-radius: 3px;
            animation: progress 2s ease-in-out forwards;
            animation-delay: 0.2s;
          }

          @keyframes progress {
            0% { width: 0%; }
            20% { width: 25%; }
            50% { width: 65%; }
            80% { width: 88%; }
            100% { width: 100%; }
          }

          .loader-text {
            color: rgba(255,255,255,0.6);
            font-size: 13px;
            margin-top: 12px;
            font-weight: 400;
            letter-spacing: 0.3px;
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      {/* Animated Background */}
      <div className="auth-background">
        <div className="gradient-orb orb1"></div>
        <div className="gradient-orb orb2"></div>
        <div className="gradient-orb orb3"></div>
        <div className="gradient-orb orb4"></div>
        <div className="grid-pattern"></div>
      </div>

      {/* Register Card */}
      <div className="auth-container">
        <div className="auth-card">
          <div className="logo-text">
            Social<span>Vibe</span>
          </div>

          <div className="slogan">
            Join the community and start your journey 🚀
          </div>

          <form onSubmit={handleRegister}>
            <div className="input-group">
              <div className="input-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="input-group">
              <div className="input-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input 
                  type="email" 
                  placeholder="Email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="input-group">
              <div className="input-icon">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input 
                  type="password" 
                  placeholder="Password (min 6 characters)" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            
            {error && <div className="auth-error">{error}</div>}
            
            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loader">
                  <span className="btn-spinner"></span>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="social-btn" onClick={handleGoogleLogin} disabled={loading}>
            <svg className="social-icon" viewBox="0 0 24 24">
              <path fill="#ea4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#4285f4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#34a853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          
          <button className="social-btn" onClick={handleAppleLogin} disabled={loading}>
            <svg className="social-icon" viewBox="0 0 24 24">
              <path fill="#000" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continue with Apple
          </button>
          
          <button className="social-btn" onClick={handleMicrosoftLogin} disabled={loading}>
            <svg className="social-icon" viewBox="0 0 24 24">
              <rect x="1" y="1" width="10" height="10" fill="#f25022"/>
              <rect x="13" y="1" width="10" height="10" fill="#7fba00"/>
              <rect x="1" y="13" width="10" height="10" fill="#00a4ef"/>
              <rect x="13" y="13" width="10" height="10" fill="#ffb900"/>
            </svg>
            Continue with Microsoft
          </button>

          <div className="signup">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>

      <style>{`
        /* Wrapper and Background */
        .auth-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          background: #0a0a1a;
        }

        .auth-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          animation: float 20s ease-in-out infinite;
        }

        .orb1 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          top: -150px;
          right: -100px;
          animation-delay: 0s;
        }

        .orb2 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          bottom: -100px;
          left: -100px;
          animation-delay: -5s;
        }

        .orb3 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #ec4899, #f59e0b);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: -10s;
        }

        .orb4 {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #06b6d4, #7c3aed);
          bottom: 20%;
          right: 20%;
          animation-delay: -15s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(50px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-30px, 30px) scale(0.9);
          }
          75% {
            transform: translate(30px, 50px) scale(1.05);
          }
        }

        .grid-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        /* Auth Container */
        .auth-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
        }
        
        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          padding: 40px 35px;
          width: 100%;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .logo-text {
          font-size: 36px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: -1px;
          color: #000;
          text-align: center;
          margin-bottom: 4px;
        }
        
        .logo-text span {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        
        .slogan {
          text-align: center;
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 30px;
          line-height: 1.6;
          font-weight: 400;
        }
        
        .input-group {
          margin-bottom: 14px;
        }

        .input-icon {
          position: relative;
        }

        .input-icon .icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #9ca3af;
          transition: color 0.3s ease;
        }

        .input-icon input:focus ~ .icon,
        .input-icon input:focus + .icon {
          color: #7c3aed;
        }
        
        .input-icon input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: #f9fafb;
          font-size: 14px;
          outline: none;
          transition: all 0.3s ease;
          color: #1f2937;
        }
        
        .input-icon input:focus {
          border-color: #7c3aed;
          background: white;
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1);
        }
        
        .input-icon input::placeholder {
          color: #9ca3af;
        }
        
        .auth-btn-primary {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          margin-top: 8px;
        }
        
        .auth-btn-primary::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .auth-btn-primary:hover:not(:disabled)::before {
          left: 100%;
        }
        
        .auth-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
        }
        
        .auth-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-loader {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-spinner {
          width: 20px;
          height: 20px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top: 2.5px solid #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .divider {
          display: flex;
          align-items: center;
          margin: 22px 0;
          color: #9ca3af;
          font-size: 13px;
        }
        
        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        
        .divider span {
          padding: 0 15px;
          font-weight: 500;
        }
        
        .social-btn {
          width: 100%;
          padding: 12px;
          margin-bottom: 10px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 14px;
          color: #1f2937;
        }
        
        .social-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .social-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .social-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
        
        .signup {
          text-align: center;
          margin-top: 22px;
          font-size: 14px;
          color: #6b7280;
        }
        
        .signup a {
          color: #7c3aed;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        
        .signup a:hover {
          color: #6d28d9;
          text-decoration: underline;
        }
        
        .auth-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 14px;
          color: #dc2626;
          font-size: 13px;
          text-align: center;
          animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }

        @media (max-width: 480px) {
          .auth-card {
            padding: 30px 20px;
          }
          
          .logo-text {
            font-size: 30px;
          }

          .orb1, .orb2, .orb3, .orb4 {
            width: 200px;
            height: 200px;
          }
        }
      `}</style>
    </div>
  )
}