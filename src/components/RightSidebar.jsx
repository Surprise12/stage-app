import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function RightSidebar({ session }) {
  const [trendingTopics, setTrendingTopics] = useState([])
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    loadTrending()
    loadSuggestions()
  }, [])

  async function loadTrending() {
    // Mock trending topics - in production, get from database
    setTrendingTopics([
      { topic: '#NewMusicFriday', posts: '12.5K', trending: true },
      { topic: '#StageCreators', posts: '8.2K', trending: true },
      { topic: '#LiveSession', posts: '5.1K', trending: true },
      { topic: '#ProducerLife', posts: '3.8K', trending: false },
      { topic: '#BeatMaking', posts: '2.9K', trending: false },
    ])
  }

  async function loadSuggestions() {
    // Get users to follow (excluding current user)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, is_verified')
      .neq('id', session?.user?.id)
      .limit(5)
    
    if (data) setSuggestedUsers(data)
  }

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Trending Section */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔥 Trending Now
        </h3>
        {trendingTopics.map((topic, index) => (
          <div
            key={index}
            style={{
              padding: '12px 0',
              borderBottom: index < trendingTopics.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              cursor: 'pointer'
            }}
            onClick={() => alert(`Search for ${topic.topic}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{topic.topic}</div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>{topic.posts} posts</div>
              </div>
              {topic.trending && <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>📈 Trending</span>}
            </div>
          </div>
        ))}
      </div>
      
      {/* Suggested Users */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👥 Suggested For You
        </h3>
        {suggestedUsers.map((user) => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              cursor: 'pointer'
            }}
            onClick={() => navigate(`/profile/${user.id}`)}
          >
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username || 'U')[0]}&background=7c3aed&color=fff`}
              style={{ width: '44px', height: '44px', borderRadius: '50%' }}
              alt="avatar"
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {user.display_name || user.username}
                {user.is_verified && <span style={{ color: '#3b82f6', fontSize: '12px' }}>✓</span>}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#888' }}>@{user.username}</div>
            </div>
            <button 
              className="btn btn-primary btn-small" 
              style={{ padding: '6px 12px', fontSize: '0.7rem' }}
              onClick={(e) => { e.stopPropagation(); alert('Follow feature coming') }}
            >
              Follow
            </button>
          </div>
        ))}
      </div>
      
      {/* Tips Section */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>💡 Pro Tips</h3>
        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '12px' }}>
          Get verified to upload music videos and reach more fans!
        </p>
        <button className="btn btn-primary btn-small" style={{ width: '100%' }} onClick={() => navigate('/settings')}>
          Apply for Verification
        </button>
      </div>
    </div>
  )
}