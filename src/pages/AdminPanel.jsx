// src/pages/AdminPanel.jsx - UPDATED WITH ALL FEATURES
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
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    checkAdminStatus()
  }, [])

  async function checkAdminStatus() {
    try {
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
    } catch (error) {
      console.error('Error checking admin status:', error)
      setLoading(false)
    }
  }

  async function loadPlatformStats() {
    try {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      const { count: totalArtists } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)
      
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
      
      const { count: totalVideos } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
      
      const { count: totalGigs } = await supabase
        .from('gigs')
        .select('*', { count: 'exact', head: true })
      
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
    } catch (error) {
      console.error('Error loading platform stats:', error)
    }
  }

  async function loadAdminData() {
    setLoading(true)
    
    try {
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (usersData) setUsers(usersData)
      
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
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
    
    setLoading(false)
  }

  async function verifyUser(userId, role) {
    try {
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
    } catch (error) {
      console.error('Error verifying user:', error)
    }
  }

  async function rejectVerification(requestId, userId) {
    try {
      await supabase
        .from('verification_requests')
        .update({ status: 'rejected', reviewed_by: session.user.id, reviewed_at: new Date().toISOString() })
        .eq('id', requestId)
      
      alert('Verification request rejected')
      loadAdminData()
    } catch (error) {
      console.error('Error rejecting verification:', error)
    }
  }

  async function removeVerification(userId) {
    if (confirm('Remove verified status from this user?')) {
      try {
        await supabase
          .from('profiles')
          .update({ is_verified: false, role: 'user' })
          .eq('id', userId)
        
        alert('Verification removed')
        loadAdminData()
        loadPlatformStats()
      } catch (error) {
        console.error('Error removing verification:', error)
      }
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
        try {
          await supabase.from(table).delete().eq('id', contentId)
          alert('Content deleted successfully')
          loadAdminData()
          loadPlatformStats()
        } catch (error) {
          console.error('Error deleting content:', error)
        }
      }
    }
  }

  async function dismissReport(reportId) {
    try {
      await supabase
        .from('reported_content')
        .update({ status: 'dismissed', reviewed_by: session.user.id, reviewed_at: new Date().toISOString() })
        .eq('id', reportId)
      
      loadAdminData()
    } catch (error) {
      console.error('Error dismissing report:', error)
    }
  }

  async function makeAdmin(userId, currentStatus) {
    try {
      await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId)
      
      alert(currentStatus ? 'Admin rights removed' : 'Admin rights granted')
      loadAdminData()
    } catch (error) {
      console.error('Error making admin:', error)
    }
  }

  async function suspendUser(userId, currentStatus) {
    try {
      await supabase
        .from('profiles')
        .update({ is_suspended: !currentStatus })
        .eq('id', userId)
      
      alert(currentStatus ? 'User unsuspended' : 'User suspended')
      loadAdminData()
    } catch (error) {
      console.error('Error suspending user:', error)
    }
  }

  async function deleteUser(userId) {
    try {
      // Delete user from auth
      await supabase.auth.admin.deleteUser(userId)
      
      // Profile will be deleted via cascade
      alert('User deleted successfully')
      loadAdminData()
      loadPlatformStats()
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user: ' + error.message)
    }
  }

  async function createUser() {
    if (!newUser.email || !newUser.username || !newUser.password) {
      alert('Please fill in all fields')
      return
    }

    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        user_metadata: { username: newUser.username, display_name: newUser.username },
        email_confirm: true
      })

      if (error) throw error

      await supabase
        .from('profiles')
        .update({ role: newUser.role })
        .eq('id', data.user.id)
      
      alert('✅ User created successfully!')
      setShowAddUserModal(false)
      setNewUser({ email: '', username: '', password: '', role: 'user' })
      loadAdminData()
      loadPlatformStats()
    } catch (error) {
      alert('Error: ' + error.message)
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

  const styles = {
    wrapper: {
      minHeight: '100vh',
      padding: '20px',
      background: '#0a0a1a'
    },
    container: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      marginBottom: '24px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      padding: '20px 24px',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    logoText: {
      fontSize: '24px',
      fontWeight: '800',
      cursor: 'pointer',
      letterSpacing: '-0.5px',
      color: '#000'
    },
    logoGradient: {
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      '-webkit-background-clip': 'text',
      backgroundClip: 'text',
      color: 'transparent'
    },
    adminTitle: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937',
      margin: 0
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      background: '#f3f4f6',
      borderRadius: '10px',
      padding: '8px 14px',
      gap: '8px',
      border: '2px solid transparent',
      transition: 'all 0.3s ease',
      minWidth: '200px'
    },
    searchIcon: {
      width: '18px',
      height: '18px',
      color: '#9ca3af'
    },
    searchInput: {
      border: 'none',
      outline: 'none',
      background: 'transparent',
      fontSize: '14px',
      width: '100%',
      color: '#1f2937',
      fontWeight: '700'
    },
    btn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    btnPrimary: {
      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      color: 'white'
    },
    btnSecondary: {
      background: '#e5e7eb',
      color: '#1f2937'
    },
    btnSuccess: {
      background: '#10b981',
      color: 'white'
    },
    btnDanger: {
      background: '#ef4444',
      color: 'white'
    },
    btnDangerOutline: {
      background: 'transparent',
      color: '#ef4444',
      border: '2px solid #ef4444'
    },
    btnWarning: {
      background: '#f59e0b',
      color: 'white'
    },
    btnOutline: {
      background: 'transparent',
      color: '#6b7280',
      border: '2px solid #d1d5db'
    },
    btnSmall: {
      padding: '6px 14px',
      fontSize: '12px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    },
    statCard: {
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    },
    statIcon: {
      fontSize: '32px',
      lineHeight: 1
    },
    statContent: {
      flex: 1
    },
    statNumber: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1f2937',
      lineHeight: 1.2
    },
    statLabel: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    statTrend: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#10b981',
      padding: '2px 8px',
      background: 'rgba(16,185,129,0.1)',
      borderRadius: '12px'
    },
    tabsContainer: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      padding: '6px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    },
    tabBtn: {
      flex: 1,
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      background: 'transparent',
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    tabBtnActive: {
      background: '#7c3aed',
      color: 'white',
      boxShadow: '0 4px 15px rgba(124,58,237,0.3)'
    },
    tabContent: {
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.2)',
      padding: '24px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      minHeight: '400px'
    },
    overviewGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px'
    },
    card: {
      background: '#f9fafb',
      borderRadius: '12px',
      overflow: 'hidden'
    },
    cardHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #e5e7eb'
    },
    cardHeaderTitle: {
      margin: 0,
      fontSize: '16px',
      fontWeight: '700',
      color: '#1f2937'
    },
    cardBody: {
      padding: '20px'
    },
    statRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      color: '#4b5563',
      fontSize: '14px',
      fontWeight: '700'
    },
    statRowStrong: {
      color: '#1f2937',
      fontWeight: '700'
    },
    usersList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    userCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '16px 20px',
      background: '#f9fafb',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px'
    },
    userAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    userDetails: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
    },
    userName: {
      fontWeight: '600',
      color: '#1f2937'
    },
    userUsername: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    userEmail: {
      fontSize: '12px',
      color: '#9ca3af',
      fontWeight: '700'
    },
    userDate: {
      fontSize: '11px',
      color: '#9ca3af',
      fontWeight: '700'
    },
    userBadges: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap',
      marginTop: '4px'
    },
    badge: {
      fontSize: '11px',
      padding: '2px 10px',
      borderRadius: '12px',
      fontWeight: '600'
    },
    badgeVerified: {
      background: 'rgba(16,185,129,0.1)',
      color: '#10b981'
    },
    badgeAdmin: {
      background: 'rgba(245,158,11,0.1)',
      color: '#f59e0b'
    },
    badgeSuspended: {
      background: 'rgba(239,68,68,0.1)',
      color: '#ef4444'
    },
    userActions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px 20px',
      color: '#6b7280'
    },
    emptyIcon: {
      fontSize: '48px',
      marginBottom: '12px'
    },
    verificationCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '16px 20px',
      background: '#f9fafb',
      borderRadius: '12px',
      transition: 'all 0.3s ease'
    },
    verificationInfo: {
      flex: 1
    },
    verificationUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '4px'
    },
    verificationUserStrong: {
      color: '#1f2937'
    },
    verificationRole: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    verificationEmail: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    verificationMessage: {
      marginTop: '6px',
      padding: '8px 12px',
      background: 'white',
      borderRadius: '8px',
      fontSize: '13px',
      color: '#4b5563',
      fontWeight: '700'
    },
    verificationDate: {
      fontSize: '12px',
      color: '#9ca3af',
      marginTop: '6px',
      fontWeight: '700'
    },
    verificationActions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    reportCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: '16px',
      padding: '16px 20px',
      background: '#f9fafb',
      borderRadius: '12px',
      transition: 'all 0.3s ease'
    },
    reportInfo: {
      flex: 1
    },
    reportTitle: {
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '4px'
    },
    reportBy: {
      fontWeight: '400',
      fontSize: '13px',
      color: '#6b7280',
      marginLeft: '8px',
      fontWeight: '700'
    },
    reportReason: {
      fontSize: '13px',
      color: '#4b5563',
      padding: '6px 12px',
      background: 'white',
      borderRadius: '8px',
      display: 'inline-block',
      fontWeight: '700'
    },
    reportDate: {
      fontSize: '12px',
      color: '#9ca3af',
      marginTop: '6px',
      fontWeight: '700'
    },
    reportActions: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap'
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease'
    },
    modalContent: {
      background: 'white',
      borderRadius: '16px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      animation: 'slideUp 0.3s ease'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 24px',
      borderBottom: '1px solid #e5e7eb'
    },
    modalHeaderTitle: {
      margin: 0,
      fontSize: '18px',
      color: '#1f2937',
      fontWeight: '700'
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '28px',
      color: '#9ca3af',
      cursor: 'pointer',
      transition: 'color 0.3s'
    },
    modalBody: {
      padding: '24px'
    },
    modalFooter: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      padding: '16px 24px',
      borderTop: '1px solid #e5e7eb'
    },
    formGroup: {
      marginBottom: '16px'
    },
    formLabel: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#1f2937',
      marginBottom: '4px'
    },
    formInput: {
      width: '100%',
      padding: '12px 14px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      outline: 'none',
      background: '#f9fafb',
      fontWeight: '700'
    },
    formSelect: {
      width: '100%',
      padding: '12px 14px',
      border: '2px solid #e5e7eb',
      borderRadius: '10px',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      outline: 'none',
      background: '#f9fafb',
      appearance: 'none',
      fontWeight: '700'
    },
    spinner: {
      width: '50px',
      height: '50px',
      border: '4px solid #e5e7eb',
      borderTop: '4px solid #7c3aed',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
    deleteModal: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      maxWidth: '420px',
      width: '90%',
      textAlign: 'center'
    },
    deleteIcon: {
      fontSize: '48px',
      marginBottom: '16px'
    },
    deleteTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    deleteText: {
      color: '#6b7280',
      marginBottom: '20px',
      fontWeight: '700'
    },
    deleteButtons: {
      display: 'flex',
      gap: '12px'
    },
    deleteCancel: {
      flex: 1,
      padding: '12px',
      background: '#e5e7eb',
      color: '#1f2937',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    deleteConfirm: {
      flex: 1,
      padding: '12px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    }
  }

  if (!isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: '#0a0a1a'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '24px',
          padding: '40px 35px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '28px', fontWeight: '800', marginBottom: '20px' }}>
            Social<span style={{ color: '#7c3aed' }}>Vibe</span>
          </div>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔒</div>
          <h2 style={{ marginBottom: '12px', fontWeight: 700 }}>Access Denied</h2>
          <p style={{ color: '#6b7280', fontWeight: 700 }}>You don't have permission to access the admin panel.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fb' }}>
        <div style={styles.spinner}></div>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.logoText}>
              Social<span style={styles.logoGradient}>Vibe</span>
            </div>
            <h1 style={styles.adminTitle}>👑 Admin Panel</h1>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.searchBox}>
              <svg style={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input 
                type="text" 
                style={styles.searchInput}
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              style={{...styles.btn, ...styles.btnPrimary}}
              onClick={() => setShowAddUserModal(true)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(124,58,237,0.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              Add User
            </button>
            <button 
              style={{...styles.btn, ...styles.btnSecondary}}
              onClick={exportData}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#d1d5db'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard} onClick={() => setActiveTab('users')}>
            <div style={styles.statIcon}>👥</div>
            <div style={styles.statContent}>
              <div style={{...styles.statNumber, color: '#7c3aed'}}>{platformStats.totalUsers.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Users</div>
            </div>
            <div style={styles.statTrend}>↑ 12%</div>
          </div>
          <div style={styles.statCard} onClick={() => setActiveTab('users')}>
            <div style={styles.statIcon}>🎨</div>
            <div style={styles.statContent}>
              <div style={{...styles.statNumber, color: '#ec4899'}}>{platformStats.totalArtists.toLocaleString()}</div>
              <div style={styles.statLabel}>Verified Artists</div>
            </div>
            <div style={styles.statTrend}>↑ 8%</div>
          </div>
          <div style={styles.statCard} onClick={() => setActiveTab('reports')}>
            <div style={styles.statIcon}>📝</div>
            <div style={styles.statContent}>
              <div style={{...styles.statNumber, color: '#3b82f6'}}>{platformStats.totalPosts.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Posts</div>
            </div>
            <div style={styles.statTrend}>↑ 15%</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎬</div>
            <div style={styles.statContent}>
              <div style={{...styles.statNumber, color: '#8b5cf6'}}>{platformStats.totalVideos.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Videos</div>
            </div>
            <div style={styles.statTrend}>↑ 10%</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🎵</div>
            <div style={styles.statContent}>
              <div style={{...styles.statNumber, color: '#f59e0b'}}>{platformStats.totalGigs.toLocaleString()}</div>
              <div style={styles.statLabel}>Total Gigs</div>
            </div>
            <div style={styles.statTrend}>↑ 6%</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🟢</div>
            <div style={styles.statContent}>
              <div style={{...styles.statNumber, color: '#10b981'}}>{platformStats.activeToday}</div>
              <div style={styles.statLabel}>Active Today</div>
            </div>
            <div style={styles.statTrend}>↑ 20%</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabsContainer}>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'overview' ? styles.tabBtnActive : {})}}
            onClick={() => setActiveTab('overview')}
          >
            <span>📊</span> Overview
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'users' ? styles.tabBtnActive : {})}}
            onClick={() => setActiveTab('users')}
          >
            <span>👥</span> Users ({users.length})
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'verifications' ? styles.tabBtnActive : {})}}
            onClick={() => setActiveTab('verifications')}
          >
            <span>✅</span> Verifications ({pendingVerifications.length})
          </button>
          <button 
            style={{...styles.tabBtn, ...(activeTab === 'reports' ? styles.tabBtnActive : {})}}
            onClick={() => setActiveTab('reports')}
          >
            <span>🚨</span> Reports ({reportedContent.length})
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={styles.overviewGrid}>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardHeaderTitle}>📊 Quick Stats</h3>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.statRow}>
                    <span>Total Revenue:</span>
                    <strong style={styles.statRowStrong}>$0.00</strong>
                  </div>
                  <div style={styles.statRow}>
                    <span>Pending Payouts:</span>
                    <strong style={styles.statRowStrong}>$0.00</strong>
                  </div>
                  <div style={styles.statRow}>
                    <span>Platform Fee Collected:</span>
                    <strong style={styles.statRowStrong}>$0.00</strong>
                  </div>
                  <div style={styles.statRow}>
                    <span>Total Users:</span>
                    <strong style={styles.statRowStrong}>{platformStats.totalUsers}</strong>
                  </div>
                  <div style={styles.statRow}>
                    <span>Active Today:</span>
                    <strong style={styles.statRowStrong}>{platformStats.activeToday}</strong>
                  </div>
                </div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardHeaderTitle}>📈 Growth</h3>
                </div>
                <div style={styles.cardBody}>
                  <div style={styles.statRow}>
                    <span>New users (30 days):</span>
                    <strong style={styles.statRowStrong}>+{Math.floor(users.length * 0.1)}</strong>
                  </div>
                  <div style={styles.statRow}>
                    <span>New posts (30 days):</span>
                    <strong style={styles.statRowStrong}>+{Math.floor(platformStats.totalPosts * 0.05)}</strong>
                  </div>
                  <div style={styles.statRow}>
                    <span>Verification requests:</span>
                    <strong style={styles.statRowStrong}>{pendingVerifications.length}</strong>
                  </div>
                  <div style={styles.statRow}>
                    <span>Pending reports:</span>
                    <strong style={styles.statRowStrong}>{reportedContent.length}</strong>
                  </div>
                  <div style={styles.statRow}>
                    <span>Verified artists:</span>
                    <strong style={styles.statRowStrong}>{platformStats.totalArtists}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div style={styles.usersList}>
              {filteredUsers.map(user => (
                <div key={user.id} style={styles.userCard} onClick={() => {
                  setSelectedUser(user)
                  setShowUserDetails(true)
                }}>
                  <div style={styles.userInfo}>
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=7c3aed&color=fff&size=48`}
                      style={styles.userAvatar}
                      alt={user.username}
                    />
                    <div style={styles.userDetails}>
                      <div style={styles.userName}>{user.display_name || user.username}</div>
                      <div style={styles.userUsername}>@{user.username}</div>
                      <div style={styles.userEmail}>{user.email || 'No email'}</div>
                      <div style={styles.userDate}>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                      <div style={styles.userBadges}>
                        {user.is_verified && <span style={{...styles.badge, ...styles.badgeVerified}}>✓ Verified</span>}
                        {user.is_admin && <span style={{...styles.badge, ...styles.badgeAdmin}}>Admin</span>}
                        {user.is_suspended && <span style={{...styles.badge, ...styles.badgeSuspended}}>Suspended</span>}
                      </div>
                    </div>
                  </div>
                  <div style={styles.userActions}>
                    {user.is_verified ? (
                      <button 
                        style={{...styles.btn, ...styles.btnOutline, ...styles.btnSmall}}
                        onClick={(e) => { e.stopPropagation(); removeVerification(user.id) }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.borderColor = '#9ca3af' }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d1d5db' }}
                      >
                        Remove ✓
                      </button>
                    ) : (
                      <button 
                        style={{...styles.btn, ...styles.btnPrimary, ...styles.btnSmall}}
                        onClick={(e) => {
                          e.stopPropagation()
                          const role = prompt('Enter role (artist/producer/comedian/manager):', 'artist')
                          if (role) verifyUser(user.id, role)
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        Verify
                      </button>
                    )}
                    <button 
                      style={{
                        ...styles.btn, 
                        ...styles.btnSmall,
                        ...(user.is_admin ? styles.btnOutline : styles.btnSecondary)
                      }}
                      onClick={(e) => { e.stopPropagation(); makeAdmin(user.id, user.is_admin) }}
                    >
                      {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button 
                      style={{
                        ...styles.btn, 
                        ...styles.btnSmall,
                        ...(user.is_suspended ? styles.btnWarning : styles.btnDangerOutline)
                      }}
                      onClick={(e) => { e.stopPropagation(); suspendUser(user.id, user.is_suspended) }}
                    >
                      {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button 
                      style={{
                        ...styles.btn, 
                        ...styles.btnSmall,
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        padding: '6px 14px',
                        fontSize: '12px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(user.id)
                        setShowDeleteConfirm(true)
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#dc2626' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#ef4444' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🔍</div>
                  <p>No users found</p>
                </div>
              )}
            </div>
          )}

          {/* Verifications Tab */}
          {activeTab === 'verifications' && (
            <div style={styles.usersList}>
              {pendingVerifications.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>✅</div>
                  <p>No pending verification requests</p>
                </div>
              ) : (
                pendingVerifications.map(req => (
                  <div key={req.id} style={styles.verificationCard}>
                    <div style={styles.verificationInfo}>
                      <div style={styles.verificationUser}>
                        <strong style={styles.verificationUserStrong}>{req.profiles?.display_name || req.profiles?.username}</strong>
                        <span style={styles.verificationRole}>requests {req.role_requested} verification</span>
                      </div>
                      <div style={styles.verificationEmail}>{req.profiles?.email}</div>
                      {req.message && (
                        <div style={styles.verificationMessage}>{req.message}</div>
                      )}
                      <div style={styles.verificationDate}>
                        Submitted: {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={styles.verificationActions}>
                      <button 
                        style={{...styles.btn, ...styles.btnSuccess, ...styles.btnSmall}}
                        onClick={() => verifyUser(req.user_id, req.role_requested)}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        Approve
                      </button>
                      <button 
                        style={{...styles.btn, ...styles.btnDangerOutline, ...styles.btnSmall}}
                        onClick={() => rejectVerification(req.id, req.user_id)}
                      >
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
            <div style={styles.usersList}>
              {reportedContent.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.emptyIcon}>🏁</div>
                  <p>No pending reports</p>
                </div>
              ) : (
                reportedContent.map(report => (
                  <div key={report.id} style={styles.reportCard}>
                    <div style={styles.reportInfo}>
                      <div style={styles.reportTitle}>
                        Reported {report.content_type}
                        <span style={styles.reportBy}>
                          by {report.reporter?.display_name || report.reporter?.username}
                        </span>
                      </div>
                      <div style={styles.reportReason}>Reason: {report.reason}</div>
                      <div style={styles.reportDate}>
                        Reported: {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={styles.reportActions}>
                      <button 
                        style={{...styles.btn, ...styles.btnDanger, ...styles.btnSmall}}
                        onClick={() => deleteContent(report.content_type, report.content_id)}
                      >
                        Delete Content
                      </button>
                      <button 
                        style={{...styles.btn, ...styles.btnOutline, ...styles.btnSmall}}
                        onClick={() => dismissReport(report.id)}
                      >
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
          <div style={styles.modalOverlay} onClick={() => setShowAddUserModal(false)}>
            <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalHeaderTitle}>Add New User</h3>
                <button style={styles.modalClose} onClick={() => setShowAddUserModal(false)}>×</button>
              </div>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Email *</label>
                  <input 
                    type="email" 
                    style={styles.formInput}
                    placeholder="Enter email" 
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Username *</label>
                  <input 
                    type="text" 
                    style={styles.formInput}
                    placeholder="Enter username" 
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Password *</label>
                  <input 
                    type="password" 
                    style={styles.formInput}
                    placeholder="Enter password" 
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Role</label>
                  <select 
                    style={styles.formSelect}
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
              <div style={styles.modalFooter}>
                <button 
                  style={{...styles.btn, ...styles.btnSecondary}}
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancel
                </button>
                <button 
                  style={{...styles.btn, ...styles.btnPrimary}}
                  onClick={createUser}
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div style={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
            <div style={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.deleteIcon}>⚠️</div>
              <h3 style={styles.deleteTitle}>Delete User</h3>
              <p style={styles.deleteText}>Are you sure you want to delete this user? This action cannot be undone.</p>
              <div style={styles.deleteButtons}>
                <button 
                  style={styles.deleteCancel}
                  onClick={() => setShowDeleteConfirm(false)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#d1d5db'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#e5e7eb'}
                >
                  Cancel
                </button>
                <button 
                  style={styles.deleteConfirm}
                  onClick={() => deleteUser(deleteTarget)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}