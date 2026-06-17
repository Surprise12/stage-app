// src/pages/CreatePage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function CreatePage({ session }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    avatar_url: '',
    cover_url: ''
  })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!formData.name) {
      alert('Please enter a page name')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pages')
        .insert({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          creator_id: session.user.id,
          avatar_url: formData.avatar_url || null,
          cover_url: formData.cover_url || null
        })
        .select()
        .single()

      if (error) throw error

      alert('📄 Page created successfully!')
      navigate(`/pages/${data.id}`)
    } catch (error) {
      alert('Error: ' + error.message)
    }
    setLoading(false)
  }

  const styles = {
    container: {
      maxWidth: '600px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#6b7280',
      marginBottom: '24px'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    formGroup: { marginBottom: '16px' },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: '#6b7280',
      fontWeight: '700'
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      transition: 'all 0.2s',
      background: 'white'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '100px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
      background: 'white'
    },
    submitBtn: {
      width: '100%',
      padding: '14px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s',
      marginTop: '8px'
    },
    cancelBtn: {
      width: '100%',
      padding: '14px',
      background: 'transparent',
      color: '#6b7280',
      border: '1px solid #ddd',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      marginTop: '8px',
      transition: 'all 0.2s'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>📄 Create Page</h1>
      <p style={styles.subtitle}>Build your brand and connect with followers</p>

      <div style={styles.card}>
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Page Name *</label>
            <input
              type="text"
              style={styles.input}
              placeholder="Enter page name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Category</label>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g., Music, Business, Art, Entertainment"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              placeholder="Tell people what your page is about"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Avatar URL (optional)</label>
            <input
              type="url"
              style={styles.input}
              placeholder="https://example.com/avatar.png"
              value={formData.avatar_url}
              onChange={(e) => setFormData({...formData, avatar_url: e.target.value})}
            />
          </div>

          <div style={{...styles.formGroup, marginBottom: '24px'}}>
            <label style={styles.label}>Cover URL (optional)</label>
            <input
              type="url"
              style={styles.input}
              placeholder="https://example.com/cover.png"
              value={formData.cover_url}
              onChange={(e) => setFormData({...formData, cover_url: e.target.value})}
            />
          </div>

          <button
            type="submit"
            style={styles.submitBtn}
            disabled={loading}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#6d28d9' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#7c3aed' }}
          >
            {loading ? 'Creating...' : 'Create Page'}
          </button>

          <button
            type="button"
            style={styles.cancelBtn}
            onClick={() => navigate('/pages')}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}