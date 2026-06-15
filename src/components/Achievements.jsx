// src/components/Achievements.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Achievements({ userId, session }) {
  const [achievements, setAchievements] = useState([])
  const [userAchievements, setUserAchievements] = useState([])
  const [streak, setStreak] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [activeTab, setActiveTab] = useState('achievements')
  const [loading, setLoading] = useState(true)
  const [recentAchievements, setRecentAchievements] = useState([])

  useEffect(() => {
    loadAllData()
  }, [userId])

  async function loadAllData() {
    setLoading(true)
    await Promise.all([
      loadAchievements(),
      loadUserAchievements(),
      loadStreak(),
      loadLeaderboard(),
      loadRecentAchievements()
    ])
    setLoading(false)
  }

  async function loadAchievements() {
    const { data } = await supabase
      .from('achievements')
      .select('*')
      .order('points', { ascending: true })
    if (data) setAchievements(data)
  }

  async function loadUserAchievements() {
    const { data } = await supabase
      .from('user_achievements')
      .select('*, achievements:achievement_id (*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (data) setUserAchievements(data)
  }

  async function loadStreak() {
    const { data } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (data) setStreak(data)
  }

  async function loadLeaderboard() {
    const { data } = await supabase
      .from('user_streaks')
      .select(`
        user_id,
        current_streak,
        longest_streak,
        total_activity_days,
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url,
          is_verified
        )
      `)
      .order('longest_streak', { ascending: false })
      .limit(10)
    
    if (data) setLeaderboard(data)
  }

  async function loadRecentAchievements() {
    const { data } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements:achievement_id (*),
        profiles:user_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .order('earned_at', { ascending: false })
      .limit(20)
    
    if (data) setRecentAchievements(data)
  }

  async function claimReward() {
    alert('Reward claimed! +50 bonus points added to your account')
    // In production, update user points
  }

  const totalPoints = userAchievements.reduce((sum, ua) => sum + (ua.achievements?.points || 0), 0)
  const earnedCount = userAchievements.length
  const totalCount = achievements.length
  const progressPercent = (earnedCount / totalCount) * 100

  // Group achievements by category
  const categories = {
    bronze: achievements.filter(a => a.points <= 50),
    silver: achievements.filter(a => a.points > 50 && a.points <= 150),
    gold: achievements.filter(a => a.points > 150 && a.points <= 300),
    platinum: achievements.filter(a => a.points > 300)
  }

  const categoryNames = {
    bronze: { name: 'Bronze', color: '#cd7f32', icon: '🥉' },
    silver: { name: 'Silver', color: '#c0c0c0', icon: '🥈' },
    gold: { name: 'Gold', color: '#ffd700', icon: '🥇' },
    platinum: { name: 'Platinum', color: '#e5e4e2', icon: '💎' }
  }

  if (loading) {
    return <div className="spinner"></div>
  }

  return (
    <div className="card" style={{ padding: '24px' }}>
      {/* Header Stats */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed' }}>{totalPoints}</div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>Total Points</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{earnedCount}/{totalCount}</div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>Achievements</div>
          </div>
          {streak && (
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>🔥 {streak.current_streak}</div>
              <div style={{ fontSize: '0.75rem', color: '#888' }}>Day Streak</div>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div style={{ background: '#2a2a2a', borderRadius: '20px', height: '8px', overflow: 'hidden', marginTop: '16px' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #ec4899)', borderRadius: '20px' }}></div>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '8px' }}>{earnedCount} of {totalCount} achievements unlocked</div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '20px', borderBottom: '1px solid #2a2a2a' }}>
        <div className={`tab ${activeTab === 'achievements' ? 'active' : ''}`} onClick={() => setActiveTab('achievements')}>
          Achievements
        </div>
        <div className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          Leaderboard
        </div>
        <div className={`tab ${activeTab === 'recent' ? 'active' : ''}`} onClick={() => setActiveTab('recent')}>
          Recent Earned
        </div>
        <div className={`tab ${activeTab === 'rewards' ? 'active' : ''}`} onClick={() => setActiveTab('rewards')}>
          Rewards
        </div>
      </div>

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div>
          {Object.entries(categories).map(([category, items]) => {
            if (items.length === 0) return null
            const earnedInCategory = items.filter(a => userAchievements.some(ua => ua.achievement_id === a.id)).length
            return (
              <div key={category} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{categoryNames[category].icon}</span>
                  <h4 style={{ color: categoryNames[category].color }}>{categoryNames[category].name}</h4>
                  <span style={{ fontSize: '0.7rem', color: '#888' }}>({earnedInCategory}/{items.length})</span>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {items.map(achievement => {
                    const earned = userAchievements.some(ua => ua.achievement_id === achievement.id)
                    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
                    return (
                      <div 
                        key={achievement.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '16px', 
                          padding: '16px', 
                          borderRadius: '16px', 
                          background: earned ? `rgba(124, 58, 237, 0.1)` : 'rgba(255,255,255,0.02)', 
                          border: earned ? `1px solid rgba(124, 58, 237, 0.3)` : '1px solid rgba(255,255,255,0.05)',
                          opacity: earned ? 1 : 0.6,
                          cursor: earned ? 'pointer' : 'default'
                        }}
                        onClick={() => {
                          if (earned && userAchievement) {
                            alert(`Earned on: ${new Date(userAchievement.earned_at).toLocaleDateString()}`)
                          }
                        }}
                      >
                        <div style={{ fontSize: '2.5rem' }}>{achievement.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{achievement.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>{achievement.description}</div>
                          <div style={{ fontSize: '0.7rem', marginTop: '4px', color: '#f59e0b' }}>+{achievement.points} points</div>
                        </div>
                        {earned ? (
                          <div style={{ fontSize: '1.5rem' }}>✅</div>
                        ) : (
                          <div style={{ fontSize: '0.7rem', color: '#666' }}>Locked 🔒</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div>
          <h4 style={{ marginBottom: '16px' }}>🏆 Top Streaks</h4>
          {leaderboard.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No leaderboard data yet</p>
          ) : (
            leaderboard.map((entry, index) => (
              <div key={entry.user_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #2a2a2a' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  background: index < 3 ? '#ff9800' : '#444', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 'bold',
                  color: 'white'
                }}>
                  {index + 1}
                </div>
                <img 
                  src={entry.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(entry.profiles?.username?.[0] || 'U')}&background=7c3aed&color=fff`}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  alt="avatar"
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{entry.profiles?.display_name || entry.profiles?.username}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>{entry.total_activity_days || 0} total days active</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f59e0b' }}>🔥 {entry.longest_streak}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>longest streak</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recent Earned Tab */}
      {activeTab === 'recent' && (
        <div>
          <h4 style={{ marginBottom: '16px' }}>🎉 Recently Earned</h4>
          {recentAchievements.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No achievements earned yet</p>
          ) : (
            recentAchievements.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #2a2a2a' }}>
                <div style={{ fontSize: '2rem' }}>{entry.achievements?.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{entry.achievements?.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#888' }}>Earned by {entry.profiles?.display_name || entry.profiles?.username}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>
                  {new Date(entry.earned_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rewards Tab */}
      {activeTab === 'rewards' && (
        <div>
          <h4 style={{ marginBottom: '16px' }}>🎁 Available Rewards</h4>
          <div className="grid-2" style={{ gap: '16px' }}>
            <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎨</div>
              <div style={{ fontWeight: '600' }}>Exclusive Badge</div>
              <div style={{ fontSize: '0.7rem', color: '#888', margin: '8px 0' }}>500 points</div>
              <button className="btn btn-primary btn-small" disabled={totalPoints < 500} onClick={claimReward}>
                {totalPoints >= 500 ? 'Claim' : `Need ${500 - totalPoints} more points`}
              </button>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎵</div>
              <div style={{ fontWeight: '600' }}>Featured Artist Spot</div>
              <div style={{ fontSize: '0.7rem', color: '#888', margin: '8px 0' }}>1000 points</div>
              <button className="btn btn-primary btn-small" disabled={totalPoints < 1000} onClick={claimReward}>
                {totalPoints >= 1000 ? 'Claim' : `Need ${1000 - totalPoints} more points`}
              </button>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💎</div>
              <div style={{ fontWeight: '600' }}>Platinum Profile</div>
              <div style={{ fontSize: '0.7rem', color: '#888', margin: '8px 0' }}>2500 points</div>
              <button className="btn btn-primary btn-small" disabled={totalPoints < 2500} onClick={claimReward}>
                {totalPoints >= 2500 ? 'Claim' : `Need ${2500 - totalPoints} more points`}
              </button>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👑</div>
              <div style={{ fontWeight: '600' }}>Creator of the Month</div>
              <div style={{ fontSize: '0.7rem', color: '#888', margin: '8px 0' }}>5000 points</div>
              <button className="btn btn-primary btn-small" disabled={totalPoints < 5000} onClick={claimReward}>
                {totalPoints >= 5000 ? 'Claim' : `Need ${5000 - totalPoints} more points`}
              </button>
            </div>
          </div>
          
          <div style={{ marginTop: '24px', padding: '16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,73,153,0.1))', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '2rem' }}>💡</div>
              <div>
                <div style={{ fontWeight: '600' }}>Pro Tip</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>Keep your daily streak going! Each day adds bonus points and gets you closer to rewards.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}