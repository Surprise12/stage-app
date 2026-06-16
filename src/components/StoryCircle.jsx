// src/components/StoryCircle.jsx
import React, { useState } from 'react'

export default function StoryCircle({ 
  user, 
  onClick, 
  isLive = false, 
  isViewed = false,
  hasNewStory = true,
  size = 'md',
  showName = true,
  badge = null
}) {
  const [imageError, setImageError] = useState(false)

  const sizeMap = {
    sm: { container: 56, text: '0.65rem', padding: '2px' },
    md: { container: 72, text: '0.75rem', padding: '3px' },
    lg: { container: 88, text: '0.85rem', padding: '4px' },
    xl: { container: 104, text: '0.95rem', padding: '4px' }
  }

  const selectedSize = sizeMap[size] || sizeMap.md

  const getGradient = () => {
    if (isViewed) {
      return 'linear-gradient(135deg, #666, #888)'
    }
    if (isLive) {
      return 'linear-gradient(135deg, #ef4444, #dc2626)'
    }
    return 'linear-gradient(135deg, #7c3aed, #ec4899)'
  }

  const getInitials = (name) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  const avatarUrl = user?.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.display_name || user?.username || 'U')}&background=7c3aed&color=fff&size=128`

  const displayName = user?.display_name || user?.username || 'User'

  return (
    <div 
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: onClick ? 'pointer' : 'default',
        minWidth: `${selectedSize.container + 8}px`,
        transition: 'transform 0.2s'
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.05)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <div style={{
        position: 'relative',
        width: `${selectedSize.container}px`,
        height: `${selectedSize.container}px`,
        borderRadius: '50%',
        background: getGradient(),
        padding: selectedSize.padding,
        boxShadow: isLive ? '0 0 20px rgba(239,68,68,0.3)' : 
                   hasNewStory && !isViewed ? '0 0 20px rgba(124,58,237,0.3)' : 'none',
        transition: 'all 0.3s'
      }}>
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#0a0a0a',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {imageError ? (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#7c3aed',
              color: 'white',
              fontSize: selectedSize.text === '0.65rem' ? '1rem' : selectedSize.text === '0.75rem' ? '1.2rem' : '1.5rem',
              fontWeight: 'bold'
            }}>
              {getInitials(displayName)}
            </div>
          ) : (
            <img 
              src={avatarUrl}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover' 
              }}
              alt={`${displayName}'s story`}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
          
          {/* Online Status Dot */}
          {user?.isOnline && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '14px',
              height: '14px',
              background: '#31a24c',
              borderRadius: '50%',
              border: '2px solid #0a0a0a',
              zIndex: 2
            }}></div>
          )}
          
          {/* Live Badge */}
          {isLive && (
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ef4444',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '0.55rem',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              color: 'white',
              boxShadow: '0 2px 8px rgba(239,68,68,0.4)',
              animation: 'pulse 1.5s infinite',
              zIndex: 3
            }}>
              🔴 LIVE
            </div>
          )}
          
          {/* Custom Badge */}
          {badge && (
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              zIndex: 3
            }}>
              {badge}
            </div>
          )}
          
          {/* Viewed Indicator */}
          {isViewed && !isLive && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '0.5rem',
              color: '#888',
              whiteSpace: 'nowrap'
            }}>
              Viewed
            </div>
          )}
        </div>
      </div>
      
      {showName && (
        <span style={{ 
          fontSize: selectedSize.text, 
          color: '#ccc',
          textAlign: 'center',
          maxWidth: `${selectedSize.container + 16}px`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: user?.isVerified ? 'bold' : 'normal'
        }}>
          {displayName}
          {user?.isVerified && (
            <span style={{ color: '#1da1f2', marginLeft: '2px', fontSize: '0.6rem' }}>✓</span>
          )}
        </span>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}