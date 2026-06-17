// src/components/Achievements.jsx - UPDATED WITH INLINE STYLES
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
    try {
      await Promise.all([
        loadAchievements(),
        loadUserAchievements(),
        loadStreak(),
        loadLeaderboard(),
        loadRecentAchievements()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  async function loadAchievements() {
    try {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true })
      if (data) setAchievements(data)
    } catch (error) {
      console.error('Error loading achievements:', error)
    }
  }

  async function loadUserAchievements() {
    try {
      const { data } = await supabase
        .from('user_achievements')
        .select('*, achievements:achievement_id (*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
      if (data) setUserAchievements(data)
    } catch (error) {
      console.error('Error loading user achievements:', error)
    }
  }

  async function loadStreak() {
    try {
      const { data } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single()
      if (data) setStreak(data)
    } catch (error) {
      console.log('No streak data found')
    }
  }

  async function loadLeaderboard() {
    try {
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
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  async function loadRecentAchievements() {
    try {
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
    } catch (error) {
      console.error('Error loading recent achievements:', error)
    }
  }

  async function claimReward() {
    alert('Reward claimed! +50 bonus points added to your account')
  }

  const totalPoints = userAchievements.reduce((sum, ua) => sum + (ua.achievements?.points || 0), 0)
  const earnedCount = userAchievements.length
  const totalCount = achievements.length
  const progressPercent = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0

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

  const styles = {
    container: {
      padding: '24px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '24px'
    },
    stats: {
      display: 'flex',
      justifyContent: 'center',
      gap: '48px',
      marginBottom: '16px',
      flexWrap: 'wrap'
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: '700'
    },
    statNumberPurple: {
      color: '#7c3aed'
    },
    statNumberGold: {
      color: '#f59e0b'
    },
    statNumberRed: {
      color: '#ef4444'
    },
    statLabel: {
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    progressBar: {
      background: '#e5e7eb',
      borderRadius: '20px',
      height: '8px',
      overflow: 'hidden',
      marginTop: '16px'
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
      borderRadius: '20px',
      transition: 'width 0.3s ease'
    },
    progressText: {
      fontSize: '0.7rem',
      color: '#6b7280',
      marginTop: '8px'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '20px',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '0'
    },
    tab: {
      padding: '10px 20px',
      fontWeight: '700',
      color: '#6b7280',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s',
      fontSize: '14px'
    },
    tabActive: {
      color: '#000'
    },
    tabIndicator: {
      position: 'absolute',
      bottom: '-1px',
      left: 0,
      right: 0,
      height: '2px',
      background: '#7c3aed'
    },
    categorySection: {
      marginBottom: '24px'
    },
    categoryHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px'
    },
    categoryIcon: {
      fontSize: '1.5rem'
    },
    categoryTitle: {
      fontWeight: '700'
    },
    categoryCount: {
      fontSize: '0.7rem',
      color: '#6b7280'
    },
    achievementGrid: {
      display: 'grid',
      gap: '12px'
    },
    achievementItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      borderRadius: '16px',
      transition: 'all 0.3s',
      cursor: 'pointer'
    },
    achievementEarned: {
      background: 'rgba(124, 58, 237, 0.08)',
      border: '1px solid rgba(124, 58, 237, 0.2)'
    },
    achievementLocked: {
      background: 'rgba(0,0,0,0.02)',
      border: '1px solid rgba(0,0,0,0.05)',
      opacity: 0.6
    },
    achievementIcon: {
      fontSize: '2.5rem'
    },
    achievementInfo: {
      flex: 1
    },
    achievementName: {
      fontWeight: '600'
    },
    achievementDesc: {
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    achievementPoints: {
      fontSize: '0.7rem',
      marginTop: '4px',
      color: '#f59e0b'
    },
    achievementStatus: {
      fontSize: '1.5rem'
    },
    achievementLockedText: {
      fontSize: '0.7rem',
      color: '#6b7280'
    },
    leaderboardItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      borderBottom: '1px solid #f3f4f6'
    },
    rankBadge: {
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '700',
      color: 'white'
    },
    rankTop: {
      background: '#f59e0b'
    },
    rankDefault: {
      background: '#6b7280'
    },
    leaderboardAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    leaderboardInfo: {
      flex: 1
    },
    leaderboardName: {
      fontWeight: '600'
    },
    leaderboardSub: {
      fontSize: '0.7rem',
      color: '#6b7280'
    },
    leaderboardStreak: {
      textAlign: 'right'
    },
    leaderboardNumber: {
      fontSize: '1.2rem',
      fontWeight: '700',
      color: '#f59e0b'
    },
    leaderboardLabel: {
      fontSize: '0.7rem',
      color: '#6b7280'
    },
    recentItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      borderBottom: '1px solid #f3f4f6'
    },
    recentIcon: {
      fontSize: '2rem'
    },
    recentInfo: {
      flex: 1
    },
    recentName: {
      fontWeight: '600'
    },
    recentUser: {
      fontSize: '0.7rem',
      color: '#6b7280'
    },
    recentDate: {
      fontSize: '0.7rem',
      color: '#6b7280'
    },
    rewardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '16px'
    },
    rewardCard: {
      textAlign: 'center',
      padding: '16px',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    rewardIcon: {
      fontSize: '2rem',
      marginBottom: '8px'
    },
    rewardName: {
      fontWeight: '600'
    },
    rewardPoints: {
      fontSize: '0.7rem',
      color: '#6b7280',
      margin: '8px 0'
    },
    claimBtn: {
      padding: '6px 16px',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    claimBtnActive: {
      background: '#7c3aed',
      color: 'white'
    },
    claimBtnDisabled: {
      background: '#e5e7eb',
      color: '#9ca3af',
      cursor: 'not-allowed'
    },
    tipBox: {
      marginTop: '24px',
      padding: '16px',
      background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,73,153,0.08))',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    tipIcon: {
      fontSize: '2rem'
    },
    tipTitle: {
      fontWeight: '600'
    },
    tipText: {
      fontSize: '0.75rem',
      color: '#6b7280'
    },
    emptyState: {
      textAlign: 'center',
      padding: '20px',
      color: '#6b7280'
    }
  }

  return (
    <div style={styles.container}>
      {/* Header Stats */}
      <div style={styles.header}>
        <div style={styles.stats}>
          <div>
            <div style={{...styles.statNumber, ...styles.statNumberPurple}}>{totalPoints}</div>
            <div style={styles.statLabel}>Total Points</div>
          </div>
          <div>
            <div style={{...styles.statNumber, ...styles.statNumberGold}}>{earnedCount}/{totalCount}</div>
            <div style={styles.statLabel}>Achievements</div>
          </div>
          {streak && (
            <div>
              <div style={{...styles.statNumber, ...styles.statNumberRed}}>🔥 {streak.current_streak}</div>
              <div style={styles.statLabel}>Day Streak</div>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${progressPercent}%`}}></div>
        </div>
        <div style={styles.progressText}>{earnedCount} of {totalCount} achievements unlocked</div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <div 
          style={{...styles.tab, ...(activeTab === 'achievements' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
          {activeTab === 'achievements' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'leaderboard' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
          {activeTab === 'leaderboard' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'recent' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('recent')}
        >
          Recent Earned
          {activeTab === 'recent' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'rewards' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('rewards')}
        >
          Rewards
          {activeTab === 'rewards' && <div style={styles.tabIndicator}></div>}
        </div>
      </div>

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div>
          {Object.entries(categories).map(([category, items]) => {
            if (items.length === 0) return null
            const earnedInCategory = items.filter(a => userAchievements.some(ua => ua.achievement_id === a.id)).length
            return (
              <div key={category} style={styles.categorySection}>
                <div style={styles.categoryHeader}>
                  <span style={styles.categoryIcon}>{categoryNames[category].icon}</span>
                  <h4 style={{...styles.categoryTitle, color: categoryNames[category].color}}>
                    {categoryNames[category].name}
                  </h4>
                  <span style={styles.categoryCount}>({earnedInCategory}/{items.length})</span>
                </div>
                <div style={styles.achievementGrid}>
                  {items.map(achievement => {
                    const earned = userAchievements.some(ua => ua.achievement_id === achievement.id)
                    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id)
                    return (
                      <div 
                        key={achievement.id} 
                        style={{
                          ...styles.achievementItem,
                          ...(earned ? styles.achievementEarned : styles.achievementLocked)
                        }}
                        onClick={() => {
                          if (earned && userAchievement) {
                            alert(`Earned on: ${new Date(userAchievement.earned_at).toLocaleDateString()}`)
                          }
                        }}
                      >
                        <div style={styles.achievementIcon}>{achievement.icon}</div>
                        <div style={styles.achievementInfo}>
                          <div style={styles.achievementName}>{achievement.name}</div>
                          <div style={styles.achievementDesc}>{achievement.description}</div>
                          <div style={styles.achievementPoints}>+{achievement.points} points</div>
                        </div>
                        {earned ? (
                          <div style={styles.achievementStatus}>✅</div>
                        ) : (
                          <div style={styles.achievementLockedText}>Locked 🔒</div>
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
          <h4 style={{ marginBottom: '16px', fontWeight: '700' }}>🏆 Top Streaks</h4>
          {leaderboard.length === 0 ? (
            <p style={styles.emptyState}>No leaderboard data yet</p>
          ) : (
            leaderboard.map((entry, index) => (
              <div key={entry.user_id} style={styles.leaderboardItem}>
                <div style={{
                  ...styles.rankBadge,
                  ...(index < 3 ? styles.rankTop : styles.rankDefault)
                }}>
                  {index + 1}
                </div>
                <img 
                  src={entry.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${(entry.profiles?.username?.[0] || 'U')}&background=7c3aed&color=fff`}
                  style={styles.leaderboardAvatar}
                  alt="avatar"
                />
                <div style={styles.leaderboardInfo}>
                  <div style={styles.leaderboardName}>{entry.profiles?.display_name || entry.profiles?.username}</div>
                  <div style={styles.leaderboardSub}>{entry.total_activity_days || 0} total days active</div>
                </div>
                <div style={styles.leaderboardStreak}>
                  <div style={styles.leaderboardNumber}>🔥 {entry.longest_streak}</div>
                  <div style={styles.leaderboardLabel}>longest streak</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Recent Earned Tab */}
      {activeTab === 'recent' && (
        <div>
          <h4 style={{ marginBottom: '16px', fontWeight: '700' }}>🎉 Recently Earned</h4>
          {recentAchievements.length === 0 ? (
            <p style={styles.emptyState}>No achievements earned yet</p>
          ) : (
            recentAchievements.map(entry => (
              <div key={entry.id} style={styles.recentItem}>
                <div style={styles.recentIcon}>{entry.achievements?.icon}</div>
                <div style={styles.recentInfo}>
                  <div style={styles.recentName}>{entry.achievements?.name}</div>
                  <div style={styles.recentUser}>Earned by {entry.profiles?.display_name || entry.profiles?.username}</div>
                </div>
                <div style={styles.recentDate}>
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
          <h4 style={{ marginBottom: '16px', fontWeight: '700' }}>🎁 Available Rewards</h4>
          <div style={styles.rewardsGrid}>
            <div style={styles.rewardCard}>
              <div style={styles.rewardIcon}>🎨</div>
              <div style={styles.rewardName}>Exclusive Badge</div>
              <div style={styles.rewardPoints}>500 points</div>
              <button 
                style={{
                  ...styles.claimBtn,
                  ...(totalPoints >= 500 ? styles.claimBtnActive : styles.claimBtnDisabled)
                }}
                disabled={totalPoints < 500} 
                onClick={claimReward}
              >
                {totalPoints >= 500 ? 'Claim' : `Need ${500 - totalPoints} more points`}
              </button>
            </div>
            <div style={styles.rewardCard}>
              <div style={styles.rewardIcon}>🎵</div>
              <div style={styles.rewardName}>Featured Artist Spot</div>
              <div style={styles.rewardPoints}>1000 points</div>
              <button 
                style={{
                  ...styles.claimBtn,
                  ...(totalPoints >= 1000 ? styles.claimBtnActive : styles.claimBtnDisabled)
                }}
                disabled={totalPoints < 1000} 
                onClick={claimReward}
              >
                {totalPoints >= 1000 ? 'Claim' : `Need ${1000 - totalPoints} more points`}
              </button>
            </div>
            <div style={styles.rewardCard}>
              <div style={styles.rewardIcon}>💎</div>
              <div style={styles.rewardName}>Platinum Profile</div>
              <div style={styles.rewardPoints}>2500 points</div>
              <button 
                style={{
                  ...styles.claimBtn,
                  ...(totalPoints >= 2500 ? styles.claimBtnActive : styles.claimBtnDisabled)
                }}
                disabled={totalPoints < 2500} 
                onClick={claimReward}
              >
                {totalPoints >= 2500 ? 'Claim' : `Need ${2500 - totalPoints} more points`}
              </button>
            </div>
            <div style={styles.rewardCard}>
              <div style={styles.rewardIcon}>👑</div>
              <div style={styles.rewardName}>Creator of the Month</div>
              <div style={styles.rewardPoints}>5000 points</div>
              <button 
                style={{
                  ...styles.claimBtn,
                  ...(totalPoints >= 5000 ? styles.claimBtnActive : styles.claimBtnDisabled)
                }}
                disabled={totalPoints < 5000} 
                onClick={claimReward}
              >
                {totalPoints >= 5000 ? 'Claim' : `Need ${5000 - totalPoints} more points`}
              </button>
            </div>
          </div>
          
          <div style={styles.tipBox}>
            <div style={styles.tipIcon}>💡</div>
            <div>
              <div style={styles.tipTitle}>Pro Tip</div>
              <div style={styles.tipText}>Keep your daily streak going! Each day adds bonus points and gets you closer to rewards.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}