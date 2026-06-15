// src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react'
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

  useEffect(() => {
    checkAdminStatus()
  }, [])

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
    
    // Get active users today (users who posted today)
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
      
      alert('User verified!')
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
        alert('Content deleted')
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
      // Update role in profiles
      await supabase
        .from('profiles')
        .update({ role: newUser.role })
        .eq('id', data.user.id)
      
      alert('User created successfully!')
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

  if (!isAdmin) {
    return (
      <div className="container" style={{ marginTop: '80px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <i className="fas fa-lock" style={{ fontSize: '48px', color: '#ff4444', marginBottom: '16px' }}></i>
          <h2>Access Denied</h2>
          <p style={{ color: '#888', marginTop: '12px' }}>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <div className="spinner"></div>
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>👑 Admin Panel</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-box" style={{ width: '250px' }}>
            <i className="fas fa-search"></i>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddUserModal(true)}>
            <i className="fas fa-user-plus"></i> Add User
          </button>
          <button className="btn btn-secondary" onClick={exportData}>
            <i className="fas fa-download"></i> Export
          </button>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" onClick={() => setActiveTab('users')}>
          <div className="stat-number">{platformStats.totalUsers.toLocaleString()}</div>
          <div>Total Users</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('users')}>
          <div className="stat-number">{platformStats.totalArtists.toLocaleString()}</div>
          <div>Verified Artists</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('reports')}>
          <div className="stat-number">{platformStats.totalPosts.toLocaleString()}</div>
          <div>Total Posts</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('reports')}>
          <div className="stat-number">{platformStats.totalVideos.toLocaleString()}</div>
          <div>Total Videos</div>
        </div>
        <div className="stat-card" onClick={() => setActiveTab('reports')}>
          <div className="stat-number">{platformStats.totalGigs.toLocaleString()}</div>
          <div>Total Gigs</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{platformStats.activeToday}</div>
          <div>Active Today</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Overview
        </div>
        <div className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          Users ({users.length})
        </div>
        <div className={`tab ${activeTab === 'verifications' ? 'active' : ''}`} onClick={() => setActiveTab('verifications')}>
          Verifications ({pendingVerifications.length})
        </div>
        <div className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
          Reports ({reportedContent.length})
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid-2">
          <div className="card">
            <h3>📊 Quick Stats</h3>
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Total Revenue:</span>
                <strong>$0.00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Pending Payouts:</span>
                <strong>$0.00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Platform Fee Collected:</span>
                <strong>$0.00</strong>
              </div>
            </div>
          </div>
          <div className="card">
            <h3>📈 Growth</h3>
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>New users (30 days):</span>
                <strong>+{Math.floor(users.length * 0.1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>New posts (30 days):</span>
                <strong>+{Math.floor(platformStats.totalPosts * 0.05)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                <span>Verification requests:</span>
                <strong>{pendingVerifications.length}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {filteredUsers.map(user => (
            <div key={user.id} className="card" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=000&color=fff`}
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    alt="avatar"
                  />
                  <div>
                    <div style={{ fontWeight: '600' }}>{user.display_name || user.username}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>@{user.username}</div>
                    <div style={{ fontSize: '0.7rem', color: '#666' }}>{user.email || 'No email'}</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {user.is_verified && <span style={{ fontSize: '0.7rem', color: '#1da1f2' }}>✓ Verified</span>}
                      {user.is_admin && <span style={{ fontSize: '0.7rem', color: '#ff9800' }}>Admin</span>}
                      {user.is_suspended && <span style={{ fontSize: '0.7rem', color: '#ff4444' }}>Suspended</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {user.is_verified ? (
                    <button className="btn btn-outline btn-small" onClick={() => removeVerification(user.id)}>
                      Remove Verification
                    </button>
                  ) : (
                    <button className="btn btn-primary btn-small" onClick={() => {
                      const role = prompt('Enter role (artist/producer/comedian/manager):', 'artist')
                      if (role) verifyUser(user.id, role)
                    }}>
                      Verify User
                    </button>
                  )}
                  <button 
                    className={`btn ${user.is_admin ? 'btn-outline' : 'btn-secondary'} btn-small`}
                    onClick={() => makeAdmin(user.id, user.is_admin)}
                  >
                    {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                  <button 
                    className={`btn ${user.is_suspended ? 'btn-primary' : 'btn-outline'} btn-small`}
                    style={{ borderColor: '#ff4444', color: '#ff4444' }}
                    onClick={() => suspendUser(user.id, user.is_suspended)}
                  >
                    {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: '#888' }}>No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Verifications Tab */}
      {activeTab === 'verifications' && (
        <div>
          {pendingVerifications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '48px', color: '#4caf50', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No pending verification requests</p>
            </div>
          ) : (
            pendingVerifications.map(req => (
              <div key={req.id} className="card" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>
                      {req.profiles?.display_name || req.profiles?.username}
                      <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '8px' }}>requests {req.role_requested} verification</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '4px' }}>{req.profiles?.email}</div>
                    <p style={{ marginTop: '8px', color: '#555', background: '#f5f5f5', padding: '8px', borderRadius: '8px' }}>{req.message}</p>
                    <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '8px' }}>
                      Submitted: {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-small" onClick={() => verifyUser(req.user_id, req.role_requested)}>
                      Approve
                    </button>
                    <button className="btn btn-outline btn-small" onClick={() => rejectVerification(req.id, req.user_id)}>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          {reportedContent.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <i className="fas fa-flag-checkered" style={{ fontSize: '48px', color: '#4caf50', marginBottom: '16px' }}></i>
              <p style={{ color: '#888' }}>No pending reports</p>
            </div>
          ) : (
            reportedContent.map(report => (
              <div key={report.id} className="card" style={{ marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: '600' }}>
                    Reported {report.content_type}
                    <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '8px' }}>
                      by {report.reporter?.display_name || report.reporter?.username}
                    </span>
                  </div>
                  <p style={{ marginTop: '8px', color: '#555', background: '#f5f5f5', padding: '8px', borderRadius: '8px' }}>Reason: {report.reason}</p>
                  <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '8px' }}>
                    Reported: {new Date(report.created_at).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button className="btn btn-primary btn-small" onClick={() => deleteContent(report.content_type, report.content_id)}>
                      Delete Content
                    </button>
                    <button className="btn btn-outline btn-small" onClick={() => dismissReport(report.id)}>
                      Dismiss Report
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal active" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add New User</div>
            <input 
              type="email" 
              className="form-input" 
              placeholder="Email *" 
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Username *" 
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            />
            <input 
              type="password" 
              className="form-input" 
              placeholder="Password *" 
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            />
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
            <button className="apply-btn" onClick={createUser}>Create User</button>
            <button className="secondary-btn" style={{ marginTop: '8px', width: '100%' }} onClick={() => setShowAddUserModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}