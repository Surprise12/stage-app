// src/pages/Pages.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Pages({ session }) {
  const navigate = useNavigate()
  const [pages, setPages] = useState([])
  const [myPages, setMyPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreatePage, setShowCreatePage] = useState(false)
  const [newPage, setNewPage] = useState({ name: '', category: '', description: '', avatar: '', cover: '' })

  useEffect(() => {
    loadPages()
    loadMyPages()
  }, [])

  async function loadPages() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('pages')
        .select('*')
        .order('followers_count', { ascending: false })
        .limit(20)
      if (data) setPages(data)
    } catch (error) {
      console.error('Error loading pages:', error)
    }
    setLoading(false)
  }

  async function loadMyPages() {
    try {
      const { data } = await supabase
        .from('pages')
        .select('*')
        .eq('creator_id', session.user.id)
      if (data) setMyPages(data)
    } catch (error) {
      console.error('Error loading my pages:', error)
    }
  }

  async function createPage() {
    if (!newPage.name) return
    try {
      const { data } = await supabase
        .from('pages')
        .insert({
          ...newPage,
          creator_id: session.user.id,
          followers_count: 0
        })
        .select()
        .single()
      if (data) {
        setPages([data, ...pages])
        setMyPages([...myPages, data])
        setShowCreatePage(false)
        setNewPage({ name: '', category: '', description: '', avatar: '', cover: '' })
      }
    } catch (error) {
      console.error('Error creating page:', error)
    }
  }

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937'
    },
    createBtn: {
      padding: '12px 24px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    pageCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid #e5e7eb'
    },
    pageHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    pageAvatar: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '24px',
      flexShrink: 0,
      overflow: 'hidden'
    },
    pageInfo: {
      flex: 1
    },
    pageName: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937'
    },
    pageCategory: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700'
    },
    pageDescription: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700',
      marginTop: '4px'
    },
    pageStats: {
      display: 'flex',
      gap: '16px',
      marginTop: '8px',
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    followBtn: {
      padding: '8px 20px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    modalContent: {
      background: 'white',
      borderRadius: '24px',
      padding: '32px',
      maxWidth: '500px',
      width: '90%'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '20px'
    },
    formInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none'
    },
    formTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    formBtn: {
      width: '100%',
      padding: '14px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px'
    },
    cancelBtn: {
      width: '100%',
      padding: '14px',
      background: 'transparent',
      color: '#666',
      border: '1px solid #ddd',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      marginTop: '8px'
    }
  }

  if (loading) {
    return <div className="spinner" style={{ marginTop: '40px' }}></div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>📄 Pages</div>
        <button 
          style={styles.createBtn}
          onClick={() => setShowCreatePage(true)}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
        >
          <i className="fas fa-plus"></i> Create Page
        </button>
      </div>

      {pages.map(page => (
        <div 
          key={page.id} 
          style={styles.pageCard}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <div style={styles.pageHeader}>
            <div style={styles.pageAvatar}>
              <img src={page.avatar || `https://ui-avatars.com/api/?name=${(page.name?.[0] || 'P')}&background=000&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
            <div style={styles.pageInfo}>
              <div style={styles.pageName}>{page.name}</div>
              <div style={styles.pageCategory}>{page.category || 'General'}</div>
              <div style={styles.pageDescription}>{page.description}</div>
              <div style={styles.pageStats}>
                <span>👥 {page.followers_count || 0} followers</span>
              </div>
            </div>
            <button 
              style={styles.followBtn}
              onClick={(e) => { e.stopPropagation(); alert('Following page!') }}
            >
              Follow
            </button>
          </div>
        </div>
      ))}

      {/* Create Page Modal */}
      {showCreatePage && (
        <div style={styles.modal} onClick={() => setShowCreatePage(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Create a Page</div>
            <input 
              style={styles.formInput}
              placeholder="Page name"
              value={newPage.name}
              onChange={(e) => setNewPage({...newPage, name: e.target.value})}
            />
            <input 
              style={styles.formInput}
              placeholder="Category (e.g., Music, Art, Business)"
              value={newPage.category}
              onChange={(e) => setNewPage({...newPage, category: e.target.value})}
            />
            <textarea 
              style={styles.formTextarea}
              placeholder="Description"
              value={newPage.description}
              onChange={(e) => setNewPage({...newPage, description: e.target.value})}
            />
            <input 
              style={styles.formInput}
              placeholder="Avatar URL (optional)"
              value={newPage.avatar}
              onChange={(e) => setNewPage({...newPage, avatar: e.target.value})}
            />
            <button style={styles.formBtn} onClick={createPage}>Create Page</button>
            <button style={styles.cancelBtn} onClick={() => setShowCreatePage(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}