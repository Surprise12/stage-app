// src/pages/VerifiedArtists.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function VerifiedArtists({ session }) {
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVerifiedArtists()
  }, [])

  async function loadVerifiedArtists() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified, bio, followers_count, genre')
        .eq('is_verified', true)
        .order('followers_count', { ascending: false })
        .limit(20)
      if (data) setArtists(data)
    } catch (error) {
      console.error('Error loading verified artists:', error)
    }
    setLoading(false)
  }

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '24px',
      color: '#1f2937'
    },
    artistCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      background: 'white',
      borderRadius: '16px',
      marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid #e5e7eb'
    },
    artistAvatar: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '24px',
      flexShrink: 0,
      overflow: 'hidden'
    },
    artistInfo: {
      flex: 1
    },
    artistName: {
      fontSize: '18px',
      fontWeight: '700',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    verifiedBadge: {
      color: '#1da1f2'
    },
    artistGenre: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700'
    },
    artistStats: {
      display: 'flex',
      gap: '16px',
      marginTop: '4px',
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
    }
  }

  if (loading) {
    return <div className="spinner" style={{ marginTop: '40px' }}></div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>✅ Verified Artists</div>
      {artists.map(artist => (
        <div 
          key={artist.id} 
          style={styles.artistCard}
          onClick={() => navigate(`/profile/${artist.id}`)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <div style={styles.artistAvatar}>
            <img src={artist.avatar_url || `https://ui-avatars.com/api/?name=${(artist.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          </div>
          <div style={styles.artistInfo}>
            <div style={styles.artistName}>
              {artist.display_name || artist.username}
              <span style={styles.verifiedBadge}>✓</span>
            </div>
            <div style={styles.artistGenre}>{artist.genre || 'Artist'}</div>
            <div style={styles.artistStats}>
              <span>👥 {artist.followers_count || 0} followers</span>
            </div>
          </div>
          <button style={styles.followBtn}>Follow</button>
        </div>
      ))}
    </div>
  )
}