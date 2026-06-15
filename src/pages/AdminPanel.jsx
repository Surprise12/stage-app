import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminPanel({ session }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState([])
  const [pendingVerifications, setPendingVerifications] = useState([])
  const [reportedContent, setReportedContent] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(true)

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
    } else {
      setLoading(false)
    }
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
          avatar_url
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
        )
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
      // Update verification request status
      await supabase
        .from('verification_requests')
        .update({ status: 'approved', reviewed_by: session.user.id, reviewed_at: new Date().toISOString() })
        .eq('user_id', userId)
      
      alert('User verified!')
      loadAdminData()
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
    }
  }

  async function deleteContent(contentType, contentId) {
    if (confirm(`Delete this ${contentType}?`)) {
      let table = ''
      if (contentType === 'post') table = 'posts'
      else if (contentType === 'video') table = 'videos'
      else if (contentType === 'gig') table = 'gigs'
      
      if (table) {
        await supabase.from(table).delete().eq('id', contentId)
        alert('Content deleted')
        loadAdminData()
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

  if (!isAdmin) {
    return (
      <div className="container" style={{ marginTop: '80px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
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
      <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '20px' }}>Admin Panel</h1>
      
      <div className="tabs">
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
      
      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          {users.map(user => (
            <div key={user.id} className="card" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=ff5f6d&color=fff`}
                    style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                    alt="avatar"
                  />
                  <div>
                    <div style={{ fontWeight: '600' }}>{user.display_name || user.username}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>@{user.username}</div>
                    {user.is_verified && <span style={{ fontSize: '0.7rem', color: '#1da1f2' }}>✓ Verified</span>}
                    {user.is_admin && <span style={{ fontSize: '0.7rem', color: '#ff5f6d', marginLeft: '8px' }}>Admin</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Verifications Tab */}
      {activeTab === 'verifications' && (
        <div>
          {pendingVerifications.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
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
                    <p style={{ marginTop: '8px', color: '#ccc' }}>{req.message}</p>
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
                  <p style={{ marginTop: '8px', color: '#ccc' }}>Reason: {report.reason}</p>
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
    </div>
  )
}