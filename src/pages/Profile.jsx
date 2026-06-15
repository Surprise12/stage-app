import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Profile({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  const userId = id || session?.user?.id

  useEffect(() => {
    if (userId) {
      loadProfile()
    }
  }, [userId, session])

  async function loadProfile() {
    setLoading(true)
    
    // Load profile data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    setProfile(profileData)
    setIsOwnProfile(session?.user?.id === userId)
    
    // Load followers count
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
    
    // Load following count
    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)
    
    // Load posts count
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    setStats({
      followers: followersCount || 0,
      following: followingCount || 0,
      posts: postsCount || 0
    })
    
    // Check if current user follows this profile
    if (session && !isOwnProfile) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
        .single()
      
      setIsFollowing(!!followData)
    }
    
    setLoading(false)
  }

  async function handleFollow() {
    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
      setIsFollowing(false)
      setStats(prev => ({ ...prev, followers: prev.followers - 1 }))
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: session.user.id, following_id: userId })
      setIsFollowing(true)
      setStats(prev => ({ ...prev, followers: prev.followers + 1 }))
    }
  }

  async function uploadCoverPhoto(event) {
    const file = event.target.files[0]
    if (!file) return
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
    const filePath = `${session.user.id}/${fileName}`
    
    const { error } = await supabase.storage
      .from('covers')
      .upload(filePath, file)
    
    if (error) {
      alert('Error uploading cover: ' + error.message)
      return
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath)
    
    await supabase
      .from('profiles')
      .update({ cover_photo_url: publicUrl })
      .eq('id', session.user.id)
    
    setProfile(prev => ({ ...prev, cover_photo_url: publicUrl }))
    alert('Cover photo updated!')
  }

  async function uploadAvatar(event) {
    const file = event.target.files[0]
    if (!file) return
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
    const filePath = `${session.user.id}/${fileName}`
    
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)
    
    if (error) {
      alert('Error uploading avatar: ' + error.message)
      return
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', session.user.id)
    
    setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
    alert('Avatar updated!')
  }

  if (loading) {
    return <div className="spinner"></div>
  }

  if (!profile) {
    return <div className="container"><div className="card"><p>User not found</p></div></div>
  }

  return (
    <div className="container">
      {/* Cover Photo */}
      <div className="profile-header">
        {profile.cover_photo_url ? (
          <img src={profile.cover_photo_url} className="cover-photo" alt="cover" />
        ) : (
          <div className="cover-photo" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}></div>
        )}
        {isOwnProfile && (
          <div className="cover-upload-btn">
            <label style={{ cursor: 'pointer' }}>
              📸 Change Cover
              <input type="file" accept="image/*" onChange={uploadCoverPhoto} style={{ display: 'none' }} />
            </label>
          </div>
        )}
        
        {/* Profile Info */}
        <div className="profile-info">
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img 
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${(profile.username || 'U')[0]}&background=ff5f6d&color=fff&size=120`} 
              className="profile-avatar-large" 
              alt="avatar" 
            />
            {isOwnProfile && (
              <label style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#ff5f6d', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                📷
                <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
            <div>
              <h2>
                {profile.display_name || profile.username}
                {profile.is_verified && <span className="verified-badge">✓ Verified {profile.role || 'Artist'}</span>}
              </h2>
              <p style={{ color: '#888' }}>@{profile.username}</p>
              {profile.bio && <p style={{ marginTop: '12px' }}>{profile.bio}</p>}
              
              <div className="profile-stats">
                <div className="stat">
                  <div className="stat-number">{stats.posts}</div>
                  <div className="stat-label">Posts</div>
                </div>
                <div className="stat">
                  <div className="stat-number">{stats.followers}</div>
                  <div className="stat-label">Followers</div>
                </div>
                <div className="stat">
                  <div className="stat-number">{stats.following}</div>
                  <div className="stat-label">Following</div>
                </div>
              </div>
              
              {profile.location && (
                <p style={{ color: '#888', marginTop: '8px' }}>📍 {profile.location}</p>
              )}
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#ff5f6d' }}>🌐 Website</a>
                )}
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ff5f6d' }}>📷 Instagram</a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" style={{ color: '#ff5f6d' }}>🐦 Twitter</a>
                )}
              </div>
            </div>
            
            <div>
              {!isOwnProfile && session && (
                <button 
                  className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {isOwnProfile && (
                <button className="btn btn-secondary" onClick={() => navigate('/settings')}>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Original Quality Demo */}
      <div className="card">
        <h3>📸 Original Quality Images</h3>
        <p style={{ color: '#888', marginTop: '8px' }}>Images uploaded to Stage keep their original resolution forever. No compression.</p>
        <img src="https://picsum.photos/id/1015/800/600" style={{ width: '100%', borderRadius: '16px', marginTop: '16px' }} alt="demo" />
        <button 
          className="view-original-btn" 
          style={{ marginTop: '12px', position: 'static' }} 
          onClick={() => window.open('https://picsum.photos/id/1015/800/600', '_blank')}
        >
          🔍 View Original 4K Image
        </button>
      </div>
    </div>
  )
}