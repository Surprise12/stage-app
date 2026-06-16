// src/pages/AdminPanel.jsx
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminPanel({ session }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState([])
  const [pendingVerifications, setPendingVerifications] = useState([])
  const [reportedContent, setReportedContent] = useState([])
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    totalPosts: 0,
    totalVideos: 0,
    totalGigs: 0,
    activeToday: 0
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    role: 'user'
  })
  const [isAppLoading, setIsAppLoading] = useState(true)
  const canvasRef = useRef(null)

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isAppLoading) {
      checkAdminStatus()
    }
  }, [isAppLoading])

  async function checkAdminStatus() {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()
    
    if (data?.is_admin) {
      setIsAdmin(true)
      loadAdminData()
      loadPlatformStats()
    } else {
      setLoading(false)
    }
  }

  async function loadPlatformStats() {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    // Get total artists (verified users)
    const { count: totalArtists } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified', true)
    
    // Get total posts
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
    
    // Get total videos
    const { count: totalVideos } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
    
    // Get total gigs
    const { count: totalGigs } = await supabase
      .from('gigs')
      .select('*', { count: 'exact', head: true })
    
    // Get active users today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: activeToday } = await supabase
      .from('posts')
      .select('user_id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())
    
    setPlatformStats({
      totalUsers: totalUsers || 0,
      totalArtists: totalArtists || 0,
      totalPosts: totalPosts || 0,
      totalVideos: totalVideos || 0,
      totalGigs: totalGigs || 0,
      activeToday: activeToday || 0
    })
  }

  async function loadAdminData() {
    setLoading(true)
    
    // Load all users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (usersData) setUsers(usersData)
    
    // Load pending verification requests
    const { data: verifications } = await supabase
      .from('verification_requests')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url,
          email
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (verifications) setPendingVerifications(verifications)
    
    // Load reported content
    const { data: reports } = await supabase
      .from('reported_content')
      .select(`
        *,
        reporter:reporter_id (
          id,
          username,
          display_name
        ),
        content:content_id (*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (reports) setReportedContent(reports)
    
    setLoading(false)
  }

  async function verifyUser(userId, role) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true, role: role })
      .eq('id', userId)
    
    if (!error) {
      await supabase
        .from('verification_requests')
        .update({ status: 'approved', reviewed_by: session.user.id, reviewed_at: new Date().toISOString() })
        .eq('user_id', userId)
      
      alert('🎉 User verified successfully!')
      loadAdminData()
      loadPlatformStats()
    }
  }

  async function rejectVerification(requestId, userId) {
    await supabase
      .from('verification_requests')
      .update({ status: 'rejected', reviewed_by: session.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', requestId)
    
    alert('Verification request rejected')
    loadAdminData()
  }

  async function removeVerification(userId) {
    if (confirm('Remove verified status from this user?')) {
      await supabase
        .from('profiles')
        .update({ is_verified: false, role: 'user' })
        .eq('id', userId)
      
      alert('Verification removed')
      loadAdminData()
      loadPlatformStats()
    }
  }

  async function deleteContent(contentType, contentId) {
    if (confirm(`Delete this ${contentType}?`)) {
      let table = ''
      if (contentType === 'post') table = 'posts'
      else if (contentType === 'video') table = 'videos'
      else if (contentType === 'gig') table = 'gigs'
      else if (contentType === 'beat') table = 'beats'
      
      if (table) {
        await supabase.from(table).delete().eq('id', contentId)
        alert('Content deleted successfully')
        loadAdminData()
        loadPlatformStats()
      }
    }
  }

  async function dismissReport(reportId) {
    await supabase
      .from('reported_content')
      .update({ status: 'dismissed', reviewed_by: session.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', reportId)
    
    loadAdminData()
  }

  async function makeAdmin(userId, currentStatus) {
    await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId)
    
    alert(currentStatus ? 'Admin rights removed' : 'Admin rights granted')
    loadAdminData()
  }

  async function suspendUser(userId, currentStatus) {
    await supabase
      .from('profiles')
      .update({ is_suspended: !currentStatus })
      .eq('id', userId)
    
    alert(currentStatus ? 'User unsuspended' : 'User suspended')
    loadAdminData()
  }

  async function createUser() {
    if (!newUser.email || !newUser.username || !newUser.password) {
      alert('Please fill in all fields')
      return
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: newUser.email,
      password: newUser.password,
      user_metadata: { username: newUser.username, display_name: newUser.username },
      email_confirm: true
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      await supabase
        .from('profiles')
        .update({ role: newUser.role })
        .eq('id', data.user.id)
      
      alert('✅ User created successfully!')
      setShowAddUserModal(false)
      setNewUser({ email: '', username: '', password: '', role: 'user' })
      loadAdminData()
      loadPlatformStats()
    }
  }

  async function exportData() {
    const data = {
      users: users,
      verifications: pendingVerifications,
      reports: reportedContent,
      stats: platformStats,
      exportedAt: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `socialvibe_admin_export_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
              <div className="loader-text">Loading admin panel...</div>
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
            animation-delay: 1.5s;
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
            animation: progress 1.5s ease-in-out forwards;
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

  if (!isAdmin) {
    return (
      <div className="auth-wrapper">
        <div className="auth-background">
          <div className="gradient-orb orb1"></div>
          <div className="gradient-orb orb2"></div>
          <div className="gradient-orb orb3"></div>
          <div className="gradient-orb orb4"></div>
          <div className="grid-pattern"></div>
        </div>
        <div className="auth-container" style={{ marginTop: '0' }}>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div className="logo-text" style={{ marginBottom: '20px' }}>
              Social<span>Vibe</span>
            </div>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
            <h2 style={{ marginBottom: '12px', fontWeight: 700 }}>Access Denied</h2>
            <p style={{ color: '#6b7280' }}>You don't have permission to access the admin panel.</p>
          </div>
        </div>
        <style>{`
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
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(50px, -50px) scale(1.1); }
            50% { transform: translate(-30px, 30px) scale(0.9); }
            75% { transform: translate(30px, 50px) scale(1.05); }
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
            0% { transform: translate(0, 0); }
            100% { transform: translate(50px, 50px); }
          }

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
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
            font-size: 32px;
            font-weight: 800;
            cursor: pointer;
            letter-spacing: -0.5px;
            color: #000;
            text-align: center;
          }

          .logo-text span {
            background: linear-gradient(135deg, #7c3aed, #ec4899);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
        `}</style>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <style>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f4f6fb;
          }
          .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e5e7eb;
            border-top: 4px solid #7c3aed;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="admin-wrapper">
      {/* Background */}
      <div className="admin-background">
        <div className="gradient-orb orb1"></div>
        <div className="gradient-orb orb2"></div>
        <div className="gradient-orb orb3"></div>
        <div className="gradient-orb orb4"></div>
        <div className="grid-pattern"></div>
      </div>

      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div className="header-left">
            <div className="logo-text">
              Social<span>Vibe</span>
            </div>
            <h1 className="admin-title">👑 Admin Panel</h1>
          </div>
          <div className="header-right">
            <div className="search-box">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddUserModal(true)}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              Add User
            </button>
            <button className="btn btn-secondary" onClick={exportData}>
              <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card stat-users" onClick={() => setActiveTab('users')}>
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{platformStats.totalUsers.toLocaleString()}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-trend">↑ 12%</div>
          </div>
          <div className="stat-card stat-artists" onClick={() => setActiveTab('users')}>
            <div className="stat-icon">🎨</div>
            <div className="stat-content">
              <div className="stat-number">{platformStats.totalArtists.toLocaleString()}</div>
              <div className="stat-label">Verified Artists</div>
            </div>
            <div className="stat-trend">↑ 8%</div>
          </div>
          <div className="stat-card stat-posts" onClick={() => setActiveTab('reports')}>
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-number">{platformStats.totalPosts.toLocaleString()}</div>
              <div className="stat-label">Total Posts</div>
            </div>
            <div className="stat-trend">↑ 15%</div>
          </div>
          <div className="stat-card stat-videos">
            <div className="stat-icon">🎬</div>
            <div className="stat-content">
              <div className="stat-number">{platformStats.totalVideos.toLocaleString()}</div>
              <div className="stat-label">Total Videos</div>
            </div>
            <div className="stat-trend">↑ 10%</div>
          </div>
          <div className="stat-card stat-gigs">
            <div className="stat-icon">🎵</div>
            <div className="stat-content">
              <div className="stat-number">{platformStats.totalGigs.toLocaleString()}</div>
              <div className="stat-label">Total Gigs</div>
            </div>
            <div className="stat-trend">↑ 6%</div>
          </div>
          <div className="stat-card stat-active">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <div className="stat-number">{platformStats.activeToday}</div>
              <div className="stat-label">Active Today</div>
            </div>
            <div className="stat-trend">↑ 20%</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span>📊</span> Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span>👥</span> Users ({users.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'verifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('verifications')}
          >
            <span>✅</span> Verifications ({pendingVerifications.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span>🚨</span> Reports ({reportedContent.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-grid">
              <div className="card">
                <div className="card-header">
                  <h3>📊 Quick Stats</h3>
                </div>
                <div className="card-body">
                  <div className="stat-row">
                    <span>Total Revenue:</span>
                    <strong>$0.00</strong>
                  </div>
                  <div className="stat-row">
                    <span>Pending Payouts:</span>
                    <strong>$0.00</strong>
                  </div>
                  <div className="stat-row">
                    <span>Platform Fee Collected:</span>
                    <strong>$0.00</strong>
                  </div>
                  <div className="stat-row">
                    <span>Total Users:</span>
                    <strong>{platformStats.totalUsers}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Active Today:</span>
                    <strong>{platformStats.activeToday}</strong>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <h3>📈 Growth</h3>
                </div>
                <div className="card-body">
                  <div className="stat-row">
                    <span>New users (30 days):</span>
                    <strong>+{Math.floor(users.length * 0.1)}</strong>
                  </div>
                  <div className="stat-row">
                    <span>New posts (30 days):</span>
                    <strong>+{Math.floor(platformStats.totalPosts * 0.05)}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Verification requests:</span>
                    <strong>{pendingVerifications.length}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Pending reports:</span>
                    <strong>{reportedContent.length}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Verified artists:</span>
                    <strong>{platformStats.totalArtists}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="users-list">
              {filteredUsers.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-info">
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=7c3aed&color=fff&size=48`}
                      alt={user.username}
                      className="user-avatar"
                    />
                    <div className="user-details">
                      <div className="user-name">{user.display_name || user.username}</div>
                      <div className="user-username">@{user.username}</div>
                      <div className="user-email">{user.email || 'No email'}</div>
                      <div className="user-badges">
                        {user.is_verified && <span className="badge badge-verified">✓ Verified</span>}
                        {user.is_admin && <span className="badge badge-admin">Admin</span>}
                        {user.is_suspended && <span className="badge badge-suspended">Suspended</span>}
                      </div>
                    </div>
                  </div>
                  <div className="user-actions">
                    {user.is_verified ? (
                      <button className="btn btn-outline btn-small" onClick={() => removeVerification(user.id)}>
                        Remove ✓
                      </button>
                    ) : (
                      <button className="btn btn-primary btn-small" onClick={() => {
                        const role = prompt('Enter role (artist/producer/comedian/manager):', 'artist')
                        if (role) verifyUser(user.id, role)
                      }}>
                        Verify
                      </button>
                    )}
                    <button 
                      className={`btn ${user.is_admin ? 'btn-outline' : 'btn-secondary'} btn-small`}
                      onClick={() => makeAdmin(user.id, user.is_admin)}
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button 
                      className={`btn btn-small ${user.is_suspended ? 'btn-warning' : 'btn-danger-outline'}`}
                      onClick={() => suspendUser(user.id, user.is_suspended)}
                    >
                      {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}

          {/* Verifications Tab */}
          {activeTab === 'verifications' && (
            <div className="verifications-list">
              {pendingVerifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <p>No pending verification requests</p>
                </div>
              ) : (
                pendingVerifications.map(req => (
                  <div key={req.id} className="verification-card">
                    <div className="verification-info">
                      <div className="verification-user">
                        <strong>{req.profiles?.display_name || req.profiles?.username}</strong>
                        <span className="verification-role">requests {req.role_requested} verification</span>
                      </div>
                      <div className="verification-email">{req.profiles?.email}</div>
                      {req.message && (
                        <div className="verification-message">{req.message}</div>
                      )}
                      <div className="verification-date">
                        Submitted: {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="verification-actions">
                      <button className="btn btn-success btn-small" onClick={() => verifyUser(req.user_id, req.role_requested)}>
                        Approve
                      </button>
                      <button className="btn btn-danger-outline btn-small" onClick={() => rejectVerification(req.id, req.user_id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="reports-list">
              {reportedContent.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏁</div>
                  <p>No pending reports</p>
                </div>
              ) : (
                reportedContent.map(report => (
                  <div key={report.id} className="report-card">
                    <div className="report-info">
                      <div className="report-title">
                        Reported {report.content_type}
                        <span className="report-by">
                          by {report.reporter?.display_name || report.reporter?.username}
                        </span>
                      </div>
                      <div className="report-reason">Reason: {report.reason}</div>
                      <div className="report-date">
                        Reported: {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="report-actions">
                      <button className="btn btn-danger btn-small" onClick={() => deleteContent(report.content_type, report.content_id)}>
                        Delete Content
                      </button>
                      <button className="btn btn-outline btn-small" onClick={() => dismissReport(report.id)}>
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New User</h3>
                <button className="modal-close" onClick={() => setShowAddUserModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="Enter email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Username *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter username" 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Enter password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select 
                    className="form-select" 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="artist">Artist</option>
                    <option value="producer">Producer</option>
                    <option value="comedian">Comedian</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={createUser}>Create User</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* Admin Wrapper */
        .admin-wrapper {
          min-height: 100vh;
          padding: 20px;
          position: relative;
          overflow: hidden;
          background: #0a0a1a;
        }

        .admin-background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          z-index: 0;
        }

        .admin-container {
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          padding: 20px 24px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-text {
          font-size: 24px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: -0.5px;
          color: #000;
        }

        .logo-text span {
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .admin-title {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-box {
          display: flex;
          align-items: center;
          background: #f3f4f6;
          border-radius: 10px;
          padding: 8px 14px;
          gap: 8px;
          border: 2px solid transparent;
          transition: all 0.3s ease;
          min-width: 200px;
        }

        .search-box:focus-within {
          border-color: #7c3aed;
          background: white;
          box-shadow: 0 0 0 4px rgba(124,58,237,0.1);
        }

        .search-icon {
          width: 18px;
          height: 18px;
          color: #9ca3af;
        }

        .search-box input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          width: 100%;
          color: #1f2937;
        }

        .search-box input::placeholder {
          color: #9ca3af;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
        }

        .btn-icon {
          width: 18px;
          height: 18px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(124,58,237,0.4);
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #1f2937;
        }

        .btn-secondary:hover {
          background: #d1d5db;
          transform: translateY(-2px);
        }

        .btn-success {
          background: #10b981;
          color: white;
        }

        .btn-success:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .btn-danger-outline {
          background: transparent;
          color: #ef4444;
          border: 2px solid #ef4444;
        }

        .btn-danger-outline:hover {
          background: #ef4444;
          color: white;
          transform: translateY(-2px);
        }

        .btn-warning {
          background: #f59e0b;
          color: white;
        }

        .btn-warning:hover {
          background: #d97706;
          transform: translateY(-2px);
        }

        .btn-outline {
          background: transparent;
          color: #6b7280;
          border: 2px solid #d1d5db;
        }

        .btn-outline:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
          transform: translateY(-2px);
        }

        .btn-small {
          padding: 6px 14px;
          font-size: 12px;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }

        .stat-icon {
          font-size: 32px;
          line-height: 1;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
        }

        .stat-trend {
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
          padding: 2px 8px;
          background: rgba(16,185,129,0.1);
          border-radius: 12px;
        }

        .stat-users .stat-number { color: #7c3aed; }
        .stat-artists .stat-number { color: #ec4899; }
        .stat-posts .stat-number { color: #3b82f6; }
        .stat-videos .stat-number { color: #8b5cf6; }
        .stat-gigs .stat-number { color: #f59e0b; }
        .stat-active .stat-number { color: #10b981; }

        /* Tabs */
        .tabs-container {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          padding: 6px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.2);
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .tab-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .tab-btn:hover {
          background: rgba(124,58,237,0.05);
          color: #1f2937;
        }

        .tab-btn.active {
          background: #7c3aed;
          color: white;
          box-shadow: 0 4px 15px rgba(124,58,237,0.3);
        }

        .tab-btn span {
          font-size: 16px;
        }

        /* Tab Content */
        .tab-content {
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 24px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          min-height: 400px;
        }

        /* Cards */
        .overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .card {
          background: #f9fafb;
          border-radius: 12px;
          overflow: hidden;
        }

        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .card-header h3 {
          margin: 0;
          font-size: 16px;
          color: #1f2937;
        }

        .card-body {
          padding: 20px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          color: #4b5563;
          font-size: 14px;
        }

        .stat-row strong {
          color: #1f2937;
        }

        /* User Cards */
        .users-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .user-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          padding: 16px 20px;
          background: #f9fafb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .user-card:hover {
          background: #f3f4f6;
          transform: translateX(4px);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .user-name {
          font-weight: 600;
          color: #1f2937;
        }

        .user-username {
          font-size: 13px;
          color: #6b7280;
        }

        .user-email {
          font-size: 12px;
          color: #9ca3af;
        }

        .user-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .badge {
          font-size: 11px;
          padding: 2px 10px;
          border-radius: 12px;
          font-weight: 600;
        }

        .badge-verified {
          background: rgba(16,185,129,0.1);
          color: #10b981;
        }

        .badge-admin {
          background: rgba(245,158,11,0.1);
          color: #f59e0b;
        }

        .badge-suspended {
          background: rgba(239,68,68,0.1);
          color: #ef4444;
        }

        .user-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* Verification Cards */
        .verifications-list,
        .reports-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .verification-card,
        .report-card {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
          padding: 16px 20px;
          background: #f9fafb;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .verification-card:hover,
        .report-card:hover {
          background: #f3f4f6;
        }

        .verification-info,
        .report-info {
          flex: 1;
        }

        .verification-user {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .verification-user strong {
          color: #1f2937;
        }

        .verification-role {
          font-size: 13px;
          color: #6b7280;
        }

        .verification-email {
          font-size: 13px;
          color: #6b7280;
        }

        .verification-message {
          margin-top: 6px;
          padding: 8px 12px;
          background: white;
          border-radius: 8px;
          font-size: 13px;
          color: #4b5563;
        }

        .verification-date,
        .report-date {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 6px;
        }

        .verification-actions,
        .report-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .report-title {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .report-by {
          font-weight: 400;
          font-size: 13px;
          color: #6b7280;
          margin-left: 8px;
        }

        .report-reason {
          font-size: 13px;
          color: #4b5563;
          padding: 6px 12px;
          background: white;
          border-radius: 8px;
          display: inline-block;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow: auto;
          animation: slideUp 0.3s ease;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #1f2937;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #9ca3af;
          cursor: pointer;
          transition: color 0.3s;
        }

        .modal-close:hover {
          color: #1f2937;
        }

        .modal-body {
          padding: 24px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 12px 14px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          transition: all 0.3s ease;
          outline: none;
          background: #f9fafb;
        }

        .form-input:focus,
        .form-select:focus {
          border-color: #7c3aed;
          background: white;
          box-shadow: 0 0 0 4px rgba(124,58,237,0.1);
        }

        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-left {
            justify-content: center;
          }
          
          .header-right {
            justify-content: center;
          }
          
          .search-box {
            min-width: 150px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .tabs-container {
            flex-wrap: wrap;
          }
          
          .tab-btn {
            flex: 1 1 calc(50% - 8px);
            font-size: 12px;
            padding: 10px 12px;
          }
          
          .user-card,
          .verification-card,
          .report-card {
            flex-direction: column;
            align-items: stretch;
          }
          
          .user-actions,
          .verification-actions,
          .report-actions {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .stat-card {
            padding: 14px;
          }
          
          .stat-number {
            font-size: 20px;
          }
          
          .stat-icon {
            font-size: 24px;
          }
          
          .admin-title {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}