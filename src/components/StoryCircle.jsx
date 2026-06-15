import React from 'react'

export default function StoryCircle({ user, onClick, isLive = false }) {
  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        minWidth: '80px'
      }}
    >
      <div style={{
        position: 'relative',
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
        padding: '3px'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#0a0a0a',
          overflow: 'hidden'
        }}>
          <img 
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=7c3aed&color=fff`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt="story"
          />
        </div>
        {isLive && (
          <div style={{
            position: 'absolute',
            bottom: '-2px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#ef4444',
            padding: '2px 8px',
            borderRadius: '20px',
            fontSize: '0.6rem',
            fontWeight: 'bold',
            whiteSpace: 'nowrap'
          }}>
            LIVE
          </div>
        )}
      </div>
      <span style={{ fontSize: '0.75rem', color: '#ccc' }}>{user.display_name || user.username}</span>
    </div>
  )
}