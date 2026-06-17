// src/pages/RisingStars.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RisingStars({ session }) {
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRisingStars()
  }, [])

  async function loadRisingStars() {
    setLoading(true)
    try {
      // In production, fetch rising stars based on growth metrics
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, followers_count, genre, growth_rate')
        .order('growth_rate', { ascending: false })
        .limit(20)
      if (data) setArtists(data)
    } catch (error) {
      console.error('Error loading rising stars:', error)
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
      marginBottom: '8px',
      color: '#1f2937'
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
      fontWeight: '700',
      marginBottom: '24px'
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
    rank: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#7c3aed',
      width: '40px',
      textAlign: 'center'
    },
    artistAvatar: {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '20px',
      flexShrink: 0,
      overflow: 'hidden'
    },
    artistInfo: {
      flex: 1
    },
    artistName: {
      fontSize: '16px',
      fontWeight: '700'
    },
    artistGenre: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    artistStats: {
      display: 'flex',
      gap: '12px',
      marginTop: '2px',
      fontSize: '12px',
      color: '#6b7280',
      fontWeight: '700'
    },
    growthBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      background: '#f0fdf4',
      color: '#10b981'
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
      <div style={styles.title}>⭐ Rising Stars</div>
      <div style={styles.subtitle}>Artists on the rise - watch them grow!</div>
      {artists.map((artist, index) => (
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
          <div style={styles.rank}>#{index + 1}</div>
          <div style={styles.artistAvatar}>
            <img src={artist.avatar_url || `https://ui-avatars.com/api/?name=${(artist.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          </div>
          <div style={styles.artistInfo}>
            <div style={styles.artistName}>{artist.display_name || artist.username}</div>
            <div style={styles.artistGenre}>{artist.genre || 'Artist'}</div>
            <div style={styles.artistStats}>
              <span>👥 {artist.followers_count || 0} followers</span>
              <span style={styles.growthBadge}>📈 +{artist.growth_rate || 15}% growth</span>
            </div>
          </div>
          <button style={styles.followBtn}>Follow</button>
        </div>
      ))}
    </div>
  )
}