import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Achievements({ userId }) {
  const [achievements, setAchievements] = useState([])
  const [userAchievements, setUserAchievements] = useState([])
  const [streak, setStreak] = useState(null)

  useEffect(() => {
    loadAchievements()
    loadUserAchievements()
    loadStreak()
  }, [])

  async function loadAchievements() {
    const { data } = await supabase.from('achievements').select('*').order('points', { ascending: true })
    if (data) setAchievements(data)
  }

  async function loadUserAchievements() {
    const { data } = await supabase
      .from('user_achievements')
      .select('*, achievements:achievement_id (*)')
      .eq('user_id', userId)

    if (data) setUserAchievements(data)
  }

  async function loadStreak() {
    const { data } = await supabase.from('user_streaks').select('*').eq('user_id', userId).single()
    if (data) setStreak(data)
  }

  const totalPoints = userAchievements.reduce((sum, ua) => sum + (ua.achievements?.points || 0), 0)

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h3>🏆 Achievements</h3>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '8px' }}>{totalPoints} points</div>
        {streak && (
          <div style={{ marginTop: '12px' }}>
            🔥 {streak.current_streak} day streak! (Longest: {streak.longest_streak})
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {achievements.map(achievement => {
          const earned = userAchievements.some(ua => ua.achievement_id === achievement.id)
          return (
            <div key={achievement.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: earned ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', opacity: earned ? 1 : 0.5 }}>
              <div style={{ fontSize: '2rem' }}>{achievement.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{achievement.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{achievement.description}</div>
                <div style={{ fontSize: '0.7rem', marginTop: '4px', color: '#f59e0b' }}>+{achievement.points} points</div>
              </div>
              {earned && <div style={{ fontSize: '1.5rem' }}>✅</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}