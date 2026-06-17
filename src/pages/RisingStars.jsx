// src/pages/RisingStars.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RisingStars({ session }) {
  const navigate = useNavigate()
  const [artists, setArtists] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState('week')

  useEffect(() => {
    loadRisingStars()
  }, [timeFrame])

  async function loadRisingStars() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
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
      maxWidth: '1000px',
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
    filters: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px'
    },
    filterBtn: {
      padding: '8px 20px',
      border: '1px solid #ddd',
      borderRadius: '20px',
      cursor: 'pointer',
      background: 'transparent',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    filterBtnActive: {
      background: '#7c3aed',
      color: 'white',
      borderColor: '#7c3aed'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      textAlign: 'center',
      transition: 'all 0.3s',
      cursor: 'pointer'
    },
    avatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      objectFit: 'cover',
      margin: '0 auto 12px'
    },
    name: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    verified: {
      color: '#1da1f2',
      marginLeft: '4px'
    },
    username: {
      color: '#6b7280',
      fontSize: '14px',
      marginBottom: '8px'
    },
    genre: {
      display: 'inline-block',
      background: '#f3f4f6',
      padding: '2px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      marginBottom: '12px'
    },
    stats: {
      display: 'flex',
      justifyContent: 'space-around',
      paddingTop: '12px',
      borderTop: '1px solid #f3f4f6'
    },
    stat: {
      textAlign: 'center'
    },
    statNumber: {
      fontWeight: '700',
      fontSize: '18px'
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280'
    },
    growthBadge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '700',
      background: '#f0fdf4',
      color: '#10b981',
      marginTop: '8px'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>⭐ Rising Stars</h1>
      <p style={styles.subtitle}>Artists on the rise - watch them grow!</p>

      <div style={styles.filters}>
        <button
          style={{
            ...styles.filterBtn,
            ...(timeFrame === 'week' ? styles.filterBtnActive : {})
          }}
          onClick={() => setTimeFrame('week')}
        >
          This Week
        </button>
        <button
          style={{
            ...styles.filterBtn,
            ...(timeFrame === 'month' ? styles.filterBtnActive : {})
          }}
          onClick={() => setTimeFrame('month')}
        >
          This Month
        </button>
        <button
          style={{
            ...styles.filterBtn,
            ...(timeFrame === 'year' ? styles.filterBtnActive : {})
          }}
          onClick={() => setTimeFrame('year')}
        >
          This Year
        </button>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div style={styles.grid}>
          {artists.map((artist, index) => (
            <div
              key={artist.id}
              style={styles.card}
              onClick={() => navigate(`/profile/${artist.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={artist.avatar_url || `https://ui-avatars.com/api/?name=${(artist.username || 'U')[0]}&background=7c3aed&color=fff`}
                  style={styles.avatar}
                  alt={artist.username}
                />
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  background: '#7c3aed',
                  color: 'white',
                  padding: '2px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  #{index + 1}
                </div>
              </div>

              <div style={styles.name}>
                {artist.display_name || artist.username}
                {artist.is_verified && <span style={styles.verified}>✓</span>}
              </div>
              <div style={styles.username}>@{artist.username}</div>

              {artist.genre && (
                <div style={styles.genre}>{artist.genre}</div>
              )}

              <div style={styles.growthBadge}>
                📈 +{artist.growth_rate || 15}% growth
              </div>

              <div style={styles.stats}>
                <div style={styles.stat}>
                  <div style={styles.statNumber}>{artist.followers_count || 0}</div>
                  <div style={styles.statLabel}>Followers</div>
                </div>
                <div style={styles.stat}>
                  <div style={styles.statNumber}>{artist.posts_count || 0}</div>
                  <div style={styles.statLabel}>Posts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}