// src/components/TreeBarMenu.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function TreeBarMenu({ session }) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [previousAccounts, setPreviousAccounts] = useState([])
  const [showAccounts, setShowAccounts] = useState(false)

  useEffect(() => {
    loadPreviousAccounts()
  }, [])

  async function loadPreviousAccounts() {
    try {
      // Load previously logged in accounts from localStorage
      const saved = localStorage.getItem('previousAccounts')
      if (saved) {
        setPreviousAccounts(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Error loading previous accounts:', error)
    }
  }

  function saveAccount(email) {
    try {
      const accounts = previousAccounts.filter(a => a !== email)
      accounts.unshift(email)
      const unique = [...new Set(accounts)]
      localStorage.setItem('previousAccounts', JSON.stringify(unique.slice(0, 5)))
      setPreviousAccounts(unique.slice(0, 5))
    } catch (error) {
      console.error('Error saving account:', error)
    }
  }

  async function switchAccount(email) {
    // Save current account first
    saveAccount(session.user.email)
    
    // Sign out and sign in with the other account
    await supabase.auth.signOut()
    // In a real app, you'd trigger a login flow for the other account
    // For now, we'll just redirect to login
    window.location.href = '/login'
  }

  const menuItems = [
    { icon: '👤', label: 'Your Profile', onClick: () => navigate('/profile') },
    { icon: '⭐', label: 'Upgrades', onClick: () => navigate('/upgrades') },
    { icon: '⚙️', label: 'Settings & Privacy', onClick: () => navigate('/settings') },
    { icon: '📢', label: 'Advertise', onClick: () => navigate('/advertise') },
    { icon: '❓', label: 'Help & Support', onClick: () => navigate('/help') },
    { icon: 'ℹ️', label: 'About Us', onClick: () => navigate('/about') },
    { icon: '🚪', label: 'Logout', onClick: () => {
        saveAccount(session.user.email)
        supabase.auth.signOut()
        window.location.href = '/login'
      }},
  ]

  const styles = {
    container: {
      position: 'relative'
    },
    toggleBtn: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#1f2937',
      padding: '4px 8px',
      borderRadius: '8px',
      transition: 'all 0.2s'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      right: 0,
      marginTop: '8px',
      width: '320px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      border: '1px solid #e5e7eb',
      zIndex: 1000,
      overflow: 'hidden',
      animation: 'slideUp 0.3s ease'
    },
    section: {
      padding: '8px 0'
    },
    sectionTitle: {
      padding: '8px 16px',
      fontSize: '11px',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: '#1f2937',
      fontWeight: '700'
    },
    itemIcon: {
      fontSize: '18px',
      width: '24px'
    },
    divider: {
      height: '1px',
      background: '#e5e7eb',
      margin: '4px 12px'
    },
    accountItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 16px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderLeft: '3px solid transparent'
    },
    accountItemActive: {
      borderLeft: '3px solid #7c3aed',
      background: '#f3f4f6'
    },
    accountAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: '#7c3aed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '14px'
    },
    accountEmail: {
      fontWeight: '700',
      fontSize: '13px'
    },
    accountStatus: {
      fontSize: '11px',
      color: '#6b7280'
    },
    showAccountsBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      cursor: 'pointer',
      color: '#7c3aed',
      fontWeight: '700',
      fontSize: '13px',
      transition: 'all 0.2s'
    }
  }

  return (
    <div style={styles.container}>
      <button 
        style={styles.toggleBtn}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <i className="fas fa-ellipsis-v"></i>
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          {/* User Info */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '18px'
              }}>
                {session?.user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>
                  {session?.user?.email?.split('@')[0] || 'User'}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {session?.user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Previous Accounts */}
          {previousAccounts.length > 0 && (
            <>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>Switch Accounts</div>
                {previousAccounts.slice(0, 3).map((email, index) => (
                  <div 
                    key={index}
                    style={{
                      ...styles.accountItem,
                      ...(email === session?.user?.email ? styles.accountItemActive : {})
                    }}
                    onClick={() => switchAccount(email)}
                    onMouseEnter={(e) => {
                      if (email !== session?.user?.email) {
                        e.currentTarget.style.background = '#f3f4f6'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (email !== session?.user?.email) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <div style={styles.accountAvatar}>
                      {email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.accountEmail}>{email}</div>
                      <div style={styles.accountStatus}>
                        {email === session?.user?.email ? 'Active' : 'Switch to this account'}
                      </div>
                    </div>
                    {email === session?.user?.email && (
                      <i className="fas fa-check-circle" style={{ color: '#10b981' }}></i>
                    )}
                  </div>
                ))}
                {previousAccounts.length > 3 && (
                  <div style={styles.showAccountsBtn} onClick={() => setShowAccounts(!showAccounts)}>
                    <i className={`fas fa-chevron-${showAccounts ? 'up' : 'down'}`}></i>
                    {showAccounts ? 'Show less' : `See ${previousAccounts.length - 3} more accounts`}
                  </div>
                )}
                {showAccounts && previousAccounts.slice(3).map((email, index) => (
                  <div 
                    key={index + 3}
                    style={styles.accountItem}
                    onClick={() => switchAccount(email)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={styles.accountAvatar}>
                      {email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.accountEmail}>{email}</div>
                      <div style={styles.accountStatus}>Switch to this account</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={styles.divider}></div>
            </>
          )}

          {/* Menu Items */}
          <div style={styles.section}>
            {menuItems.map((item, index) => (
              <div 
                key={index}
                style={styles.item}
                onClick={() => {
                  setIsOpen(false)
                  item.onClick()
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <span style={styles.itemIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}