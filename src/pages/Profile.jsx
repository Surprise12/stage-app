// src/pages/Profile.jsx - ENHANCED VERSION
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Profile({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [stories, setStories] = useState([])
  const [reels, setReels] = useState([])
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('posts')
  const [isFollowing, setIsFollowing] = useState(false)
  const [isFriend, setIsFriend] = useState(false)
  const [showStoriesModal, setShowStoriesModal] = useState(false)

  const userId = id || session.user.id
  const isOwnProfile = userId === session.user.id

  useEffect(() => {
    loadProfile()
    loadPosts()
    loadStories()
    loadReels()
    loadFriends()
    checkFollowStatus()
    checkFriendStatus()
  }, [userId])

  async function loadProfile() {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
    setLoading(false)
  }

  async function loadPosts() {
    try {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data) setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  async function loadStories() {
    // Stories that are less than 24 hours old
    try {
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
      
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })
      if (data) setStories(data)
    } catch (error) {
      console.error('Error loading stories:', error)
    }
  }

  async function loadReels() {
    try {
      const { data } = await supabase
        .from('reels')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setReels(data)
    } catch (error) {
      console.error('Error loading reels:', error)
    }
  }

  async function loadFriends() {
    try {
      const { data } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId)
        .limit(12)
      if (data) {
        const friendIds = data.map(f => f.friend_id)
        const { data: friendProfiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', friendIds)
        if (friendProfiles) setFriends(friendProfiles)
      }
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  async function checkFollowStatus() {
    if (isOwnProfile) return
    try {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
        .single()
      setIsFollowing(!!data)
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  async function checkFriendStatus() {
    if (isOwnProfile) return
    try {
      const { data } = await supabase
        .from('friends')
        .select('id')
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .single()
      setIsFriend(!!data)
    } catch (error) {
      console.error('Error checking friend status:', error)
    }
  }

  async function followUser() {
    try {
      await supabase
        .from('follows')
        .insert({ follower_id: session.user.id, following_id: userId })
      setIsFollowing(true)
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  async function unfollowUser() {
    try {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', session.user.id)
        .eq('following_id', userId)
      setIsFollowing(false)
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  async function addFriend() {
    try {
      await supabase
        .from('friends')
        .insert({ user_id: session.user.id, friend_id: userId })
      setIsFriend(true)
    } catch (error) {
      console.error('Error adding friend:', error)
    }
  }

  async function removeFriend() {
    try {
      await supabase
        .from('friends')
        .delete()
        .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      setIsFriend(false)
    } catch (error) {
      console.error('Error removing friend:', error)
    }
  }

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    profileCard: {
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    coverPhoto: {
      height: '200px',
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      position: 'relative'
    },
    profileInfo: {
      padding: '0 20px 20px',
      position: 'relative',
      marginTop: '-60px'
    },
    avatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      border: '4px solid white',
      background: '#666',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '48px',
      overflow: 'hidden'
    },
    nameRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      marginTop: '12px',
      gap: '12px'
    },
    name: {
      fontSize: '28px',
      fontWeight: '700'
    },
    verifiedBadge: {
      color: '#1da1f2',
      marginLeft: '8px'
    },
    username: {
      fontSize: '16px',
      color: '#6b7280',
      fontWeight: '700'
    },
    bio: {
      fontSize: '15px',
      fontWeight: '700',
      marginTop: '8px',
      color: '#1f2937'
    },
    stats: {
      display: 'flex',
      gap: '24px',
      marginTop: '16px'
    },
    stat: {
      textAlign: 'center',
      cursor: 'pointer'
    },
    statNumber: {
      fontSize: '20px',
      fontWeight: '700'
    },
    statLabel: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      marginTop: '16px',
      flexWrap: 'wrap'
    },
    followBtn: {
      padding: '8px 24px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700'
    },
    unfollowBtn: {
      padding: '8px 24px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700'
    },
    friendBtn: {
      padding: '8px 24px',
      background: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700'
    },
    unfriendBtn: {
      padding: '8px 24px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      padding: '0 20px',
      borderBottom: '2px solid #e5e7eb',
      marginTop: '16px'
    },
    tab: {
      padding: '12px 20px',
      fontWeight: '700',
      color: '#6b7280',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s'
    },
    tabActive: {
      color: '#000'
    },
    tabActiveIndicator: {
      position: 'absolute',
      bottom: '-2px',
      left: 0,
      right: 0,
      height: '2px',
      background: '#000'
    },
    content: {
      padding: '20px'
    },
    storyRow: {
      display: 'flex',
      gap: '12px',
      padding: '16px 20px',
      overflowX: 'auto',
      borderBottom: '1px solid #e5e7eb'
    },
    storyItem: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      cursor: 'pointer'
    },
    storyCircle: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      border: '3px solid #7c3aed',
      padding: '3px',
      background: '#666',
      overflow: 'hidden'
    },
    storyImage: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    storyName: {
      fontSize: '11px',
      fontWeight: '700',
      color: '#6b7280'
    },
    reelGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '4px'
    },
    reelItem: {
      aspectRatio: '1',
      background: '#666',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden'
    },
    reelImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    },
    reelOverlay: {
      position: 'absolute',
      bottom: '8px',
      right: '8px',
      color: 'white',
      fontSize: '12px',
      fontWeight: '700'
    },
    postCard: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb'
    },
    postContent: {
      fontSize: '15px',
      fontWeight: '700'
    },
    postTime: {
      fontSize: '12px',
      color: '#6b7280',
      fontWeight: '700',
      marginTop: '4px'
    },
    friendGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '16px'
    },
    friendCard: {
      textAlign: 'center',
      padding: '12px',
      background: '#f9fafb',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    friendAvatar: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: '#7c3aed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '24px',
      margin: '0 auto 8px',
      overflow: 'hidden'
    },
    friendName: {
      fontSize: '14px',
      fontWeight: '700'
    }
  }

  if (loading || !profile) {
    return <div className="spinner" style={{ marginTop: '40px' }}></div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.profileCard}>
        {/* Cover Photo */}
        <div style={styles.coverPhoto}></div>

        {/* Profile Info */}
        <div style={styles.profileInfo}>
          <div style={styles.avatar}>
            <img src={profile.avatar_url || `https://ui-avatars.com/api/?name=${(profile.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
          </div>
          <div style={styles.nameRow}>
            <div>
              <div style={styles.name}>
                {profile.display_name || profile.username}
                {profile.is_verified && <span style={styles.verifiedBadge}>✓</span>}
              </div>
              <div style={styles.username}>@{profile.username}</div>
            </div>
            <div>
              {!isOwnProfile && (
                <div style={styles.actionButtons}>
                  {isFollowing ? (
                    <button style={styles.unfollowBtn} onClick={unfollowUser}>Unfollow</button>
                  ) : (
                    <button style={styles.followBtn} onClick={followUser}>Follow</button>
                  )}
                  {isFriend ? (
                    <button style={styles.unfriendBtn} onClick={removeFriend}>Unfriend</button>
                  ) : (
                    <button style={styles.friendBtn} onClick={addFriend}>Add Friend</button>
                  )}
                </div>
              )}
            </div>
          </div>
          {profile.bio && <div style={styles.bio}>{profile.bio}</div>}
          <div style={styles.stats}>
            <div style={styles.stat}>
              <div style={styles.statNumber}>{profile.followers_count || 0}</div>
              <div style={styles.statLabel}>Followers</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNumber}>{profile.following_count || 0}</div>
              <div style={styles.statLabel}>Following</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNumber}>{friends.length}</div>
              <div style={styles.statLabel}>Friends</div>
            </div>
          </div>
        </div>

        {/* Stories */}
        {stories.length > 0 && (
          <div style={styles.storyRow}>
            {stories.map(story => (
              <div key={story.id} style={styles.storyItem} onClick={() => navigate(`/stories/${userId}`)}>
                <div style={styles.storyCircle}>
                  <img src={story.thumbnail || profile.avatar_url || `https://ui-avatars.com/api/?name=${(profile.username?.[0] || 'U')}&background=000&color=fff`} style={styles.storyImage} alt="" />
                </div>
                <div style={styles.storyName}>Story</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          <div 
            style={{...styles.tab, ...(activeTab === 'posts' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('posts')}
          >
            Posts
            {activeTab === 'posts' && <div style={styles.tabActiveIndicator}></div>}
          </div>
          <div 
            style={{...styles.tab, ...(activeTab === 'reels' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('reels')}
          >
            Reels
            {activeTab === 'reels' && <div style={styles.tabActiveIndicator}></div>}
          </div>
          <div 
            style={{...styles.tab, ...(activeTab === 'friends' ? styles.tabActive : {})}}
            onClick={() => setActiveTab('friends')}
          >
            Friends
            {activeTab === 'friends' && <div style={styles.tabActiveIndicator}></div>}
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {activeTab === 'posts' && (
            <div>
              {posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontWeight: '700' }}>
                  No posts yet
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.id} style={styles.postCard}>
                    <div style={styles.postContent}>{post.content}</div>
                    <div style={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reels' && (
            <div>
              {reels.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontWeight: '700' }}>
                  No reels yet
                </div>
              ) : (
                <div style={styles.reelGrid}>
                  {reels.map(reel => (
                    <div key={reel.id} style={styles.reelItem} onClick={() => navigate(`/reels/${userId}`)}>
                      <img src={reel.thumbnail || 'https://picsum.photos/400/400?random=1'} style={styles.reelImage} alt="" />
                      <div style={styles.reelOverlay}>▶️ {reel.views || 0}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'friends' && (
            <div>
              {friends.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280', fontWeight: '700' }}>
                  No friends yet
                </div>
              ) : (
                <div style={styles.friendGrid}>
                  {friends.map(friend => (
                    <div key={friend.id} style={styles.friendCard} onClick={() => navigate(`/profile/${friend.id}`)}>
                      <div style={styles.friendAvatar}>
                        <img src={friend.avatar_url || `https://ui-avatars.com/api/?name=${(friend.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      </div>
                      <div style={styles.friendName}>{friend.display_name || friend.username}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}