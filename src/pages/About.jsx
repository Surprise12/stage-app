// src/pages/About.jsx
import React from 'react'

export default function About() {
  const styles = {
    container: {
      maxWidth: '800px',
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
      border: '1px solid #e5e7eb',
      marginBottom: '16px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '12px'
    },
    text: {
      color: '#4b5563',
      lineHeight: '1.8',
      marginBottom: '12px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginTop: '16px'
    },
    statBox: {
      background: '#f9fafb',
      padding: '16px',
      borderRadius: '12px',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#7c3aed'
    },
    statLabel: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ℹ️ About SocialVibe</h1>
      <p style={styles.subtitle}>The ultimate platform for creators and fans</p>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Our Mission</h2>
        <p style={styles.text}>
          SocialVibe is a creator-first platform designed to empower artists, musicians, 
          and creators to connect with their audience, collaborate with others, and 
          monetize their content. We believe in the power of community and creative expression.
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Platform Stats</h2>
        <div style={styles.grid}>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>10K+</div>
            <div style={styles.statLabel}>Active Users</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>5K+</div>
            <div style={styles.statLabel}>Verified Artists</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>50K+</div>
            <div style={styles.statLabel}>Posts Created</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>100+</div>
            <div style={styles.statLabel}>Countries</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Key Features</h2>
        <ul style={{ color: '#4b5563', lineHeight: '2' }}>
          <li>🎵 Share music, videos, and content</li>
          <li>🤝 Collaborate with other creators</li>
          <li>🎪 Host virtual concerts and events</li>
          <li>📈 Analytics and monetization tools</li>
          <li>👥 Groups and community features</li>
          <li>📄 Create and follow pages</li>
        </ul>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Our Team</h2>
        <p style={styles.text}>
          SocialVibe was built by creators, for creators. Our team is passionate about 
          building a platform that helps artists thrive and connect with their audience 
          in meaningful ways.
        </p>
      </div>
    </div>
  )
}