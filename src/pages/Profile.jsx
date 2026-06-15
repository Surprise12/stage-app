// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Profile({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0, photos: 0, videos: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [userPosts, setUserPosts] = useState([])
  const [userPhotos, setUserPhotos] = useState([])
  const [userVideos, setUserVideos] = useState([])
  const [userFriends, setUserFriends] = useState([])

  const userId = id || session?.user?.id

  useEffect(() => {
    if (userId) {
      loadProfile()
      loadUserContent()
      loadUserFriends()
    }
  }, [userId, session])

  async function loadProfile() {
    setLoading(true)
    
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
    
    // Load photos count
    const { count: photosCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('image_urls', 'is', null)
    
    // Load videos count
    const { count: videosCount } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    
    setStats({
      followers: followersCount || 0,
      following: followingCount || 0,
      posts: postsCount || 0,
      photos: photosCount || 0,
      videos: videosCount || 0
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

  async function loadUserContent() {
    // Load user's posts
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (posts) setUserPosts(posts)
    
    // Load user's photos
    const { data: photos } = await supabase
      .from('posts')
      .select('id, image_urls, created_at')
      .eq('user_id', userId)
      .not('image_urls', 'is', null)
      .limit(12)
    
    if (photos) setUserPhotos(photos)
    
    // Load user's videos
    const { data: videos } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6)
    
    if (videos) setUserVideos(videos)
  }

  async function loadUserFriends() {
    // Get users that this user follows
    const { data: following } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)
      .limit(6)
    
    if (following && following.length > 0) {
      const friendIds = following.map(f => f.following_id)
      const { data: friends } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .in('id', friendIds)
      
      if (friends) setUserFriends(friends)
    }
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

  async function sendMessage() {
    navigate(`/messages?user=${userId}`)
  }

  async function shareProfile() {
    const shareUrl = `${window.location.origin}/profile/${userId}`
    navigator.clipboard.writeText(shareUrl)
    alert('Profile link copied to clipboard!')
  }

  function formatTimeAgo(date) {
    if (!date) return 'just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return <div className="spinner"></div>
  }

  if (!profile) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: '#888' }}>User not found</p>
          <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Cover Photo */}
      <div className="profile-header">
        {profile.cover_photo_url ? (
          <img src={profile.cover_photo_url} className="cover-photo" alt="cover" />
        ) : (
          <div className="cover-photo" style={{ background: 'linear-gradient(135deg, #667, #889)' }}></div>
        )}
        {isOwnProfile && (
          <div className="cover-actions">
            <label className="cover-btn" style={{ cursor: 'pointer' }}>
              <i className="fas fa-camera"></i> Edit Cover
              <input type="file" accept="image/*" onChange={uploadCoverPhoto} style={{ display: 'none' }} />
            </label>
          </div>
        )}
        
        {/* Profile Info */}
        <div className="profile-info-row">
          <div style={{ position: 'relative' }}>
            <div className="profile-avatar-large">
              <img 
                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${(profile.username || 'U')[0]}&background=000&color=fff&size=120`} 
                alt="avatar" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            {isOwnProfile && (
              <label style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#000', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid white' }}>
                <i className="fas fa-camera" style={{ fontSize: '14px', color: 'white' }}></i>
                <input type="file" accept="image/*" onChange={uploadAvatar} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          
          <div className="profile-details">
            <div className="profile-name-large">
              {profile.display_name || profile.username}
              {profile.is_verified && <span className="verified-badge" style={{ background: '#000', color: 'white' }}>✓ VERIFIED</span>}
            </div>
            <div className="profile-username">@{profile.username}</div>
            
            <div className="profile-stats-row">
              <div className="profile-stat" onClick={() => setActiveTab('posts')}>
                <div className="stat-number">{stats.posts}</div>
                <div className="stat-label">posts</div>
              </div>
              <div className="profile-stat" onClick={() => navigate(`/profile/${userId}/followers`)}>
                <div className="stat-number">{stats.followers}</div>
                <div className="stat-label">followers</div>
              </div>
              <div className="profile-stat" onClick={() => navigate(`/profile/${userId}/following`)}>
                <div className="stat-number">{stats.following}</div>
                <div className="stat-label">following</div>
              </div>
            </div>
            
            {profile.bio && <div className="profile-bio">{profile.bio}</div>}
            {profile.location && (
              <div className="profile-location">
                <i className="fas fa-map-marker-alt"></i> {profile.location}
              </div>
            )}
            {profile.website && (
              <div className="profile-website">
                <i className="fas fa-link"></i> 
                <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'none' }}>
                  {profile.website.replace('https://', '')}
                </a>
              </div>
            )}
            
            <div className="profile-social-links">
              {profile.instagram && (
                <div className="social-icon" onClick={() => window.open(`https://instagram.com/${profile.instagram}`, '_blank')}>
                  <i className="fab fa-instagram"></i>
                </div>
              )}
              {profile.twitter && (
                <div className="social-icon" onClick={() => window.open(`https://twitter.com/${profile.twitter}`, '_blank')}>
                  <i className="fab fa-twitter"></i>
                </div>
              )}
              {profile.youtube && (
                <div className="social-icon" onClick={() => window.open(`https://youtube.com/@${profile.youtube}`, '_blank')}>
                  <i className="fab fa-youtube"></i>
                </div>
              )}
              {profile.spotify && (
                <div className="social-icon" onClick={() => window.open(`https://open.spotify.com/artist/${profile.spotify}`, '_blank')}>
                  <i className="fab fa-spotify"></i>
                </div>
              )}
            </div>
            
            <div className="profile-action-buttons">
              {!isOwnProfile && session && (
                <>
                  <button className="primary-btn" onClick={handleFollow}>
                    {isFollowing ? <i className="fas fa-check"></i> : <i className="fas fa-user-plus"></i>} 
                    {isFollowing ? ' Following' : ' Follow'}
                  </button>
                  <button className="secondary-btn" onClick={sendMessage}>
                    <i className="fas fa-envelope"></i> Message
                  </button>
                  <button className="secondary-btn" onClick={shareProfile}>
                    <i className="fas fa-share"></i> Share
                  </button>
                </>
              )}
              {isOwnProfile && (
                <>
                  <button className="primary-btn" onClick={() => navigate('/settings')}>
                    <i className="fas fa-edit"></i> Edit Profile
                  </button>
                  <button className="secondary-btn" onClick={() => navigate('/settings')}>
                    <i className="fas fa-cog"></i> Settings
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Tabs */}
      <div className="profile-tabs">
        <div className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          Posts <span className="badge-small">{stats.posts}</span>
        </div>
        <div className={`profile-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
          About
        </div>
        <div className={`profile-tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
          Friends <span className="badge-small">{userFriends.length}</span>
        </div>
        <div className={`profile-tab ${activeTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveTab('photos')}>
          Photos <span className="badge-small">{stats.photos}</span>
        </div>
        <div className={`profile-tab ${activeTab === 'videos' ? 'active' : ''}`} onClick={() => setActiveTab('videos')}>
          Videos <span className="badge-small">{stats.videos}</span>
        </div>
      </div>
      
      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="profile-content-section active">
          {userPosts.length === 0 ? (
            <div className="post-card" style={{ textAlign: 'center' }}>
              <p style={{ color: '#888' }}>No posts yet.</p>
            </div>
          ) : (
            userPosts.map(post => (
              <div key={post.id} className="post-card">
                <div className="post-content">{post.content}</div>
                {post.image_urls?.[0] && (
                  <img src={post.image_urls[0]} style={{ width: '100%', borderRadius: '12px', marginTop: '12px' }} alt="post" />
                )}
                <div className="post-stats">
                  <span><i className="fas fa-heart"></i> {post.applause_count || 0} likes</span>
                  <span><i className="fas fa-comment"></i> {post.comment_count || 0} comments</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* About Tab */}
      {activeTab === 'about' && (
        <div className="profile-content-section active">
          <div className="about-grid">
            <div>
              <div className="about-item">
                <div className="about-label">Location</div>
                <div className="about-value">{profile.location || 'Not specified'}</div>
              </div>
              <div className="about-item">
                <div className="about-label">Joined</div>
                <div className="about-value">{new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              </div>
              <div className="about-item">
                <div className="about-label">Birthday</div>
                <div className="about-value">{profile.birthday || 'Not specified'}</div>
              </div>
            </div>
            <div>
              <div className="about-item">
                <div className="about-label">Role</div>
                <div className="about-value">{profile.role || 'User'}</div>
              </div>
              <div className="about-item">
                <div className="about-label">Verified</div>
                <div className="about-value">{profile.is_verified ? '✅ Yes' : 'No'}</div>
              </div>
              <div className="about-item">
                <div className="about-label">Email</div>
                <div className="about-value">{isOwnProfile ? profile.email || 'Not set' : 'Hidden'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="profile-content-section active">
          {userFriends.length === 0 ? (
            <div className="post-card" style={{ textAlign: 'center' }}>
              <p style={{ color: '#888' }}>No friends to show.</p>
            </div>
          ) : (
            <div className="friends-grid">
              {userFriends.map(friend => (
                <div key={friend.id} className="friend-card" onClick={() => navigate(`/profile/${friend.id}`)}>
                  <div className="friend-avatar">
                    <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${(friend.username?.[0] || 'U')}&background=000&color=fff`} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                  </div>
                  <div className="friend-name">{friend.display_name || friend.username}</div>
                  <div className="friend-mutual">{friend.is_verified && <span style={{ color: '#1da1f2' }}>✓ Verified</span>}</div>
                  <div className="friend-actions">
                    <button className="friend-action-btn message">Message</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Photos Tab */}
      {activeTab === 'photos' && (
        <div className="profile-content-section active">
          {userPhotos.length === 0 ? (
            <div className="post-card" style={{ textAlign: 'center' }}>
              <p style={{ color: '#888' }}>No photos yet.</p>
            </div>
          ) : (
            <div className="gallery-section">
              {userPhotos.map(photo => (
                <div key={photo.id} className="gallery-item">
                  <img src={photo.image_urls?.[0]} alt="photo" />
                  <div className="gallery-overlay">{formatTimeAgo(photo.created_at)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <div className="profile-content-section active">
          {userVideos.length === 0 ? (
            <div className="post-card" style={{ textAlign: 'center' }}>
              <p style={{ color: '#888' }}>No videos yet.</p>
            </div>
          ) : (
            <div className="video-grid">
              {userVideos.map(video => (
                <div key={video.id} className="video-card">
                  <div className="video-thumbnail">
                    <img src={video.thumbnail_url || 'https://picsum.photos/400/225'} alt="" />
                    <div className="play-button">▶️</div>
                  </div>
                  <div className="video-info">
                    <div className="video-title">{video.title}</div>
                    <div className="video-meta">{video.views_count || 0} views</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}