// src/pages/PageDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PageDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    loadPage()
    loadPosts()
    checkFollowStatus()
  }, [id])

  async function loadPage() {
    try {
      const { data } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single()
      if (data) setPage(data)
    } catch (error) {
      console.error('Error loading page:', error)
    }
  }

  async function loadPosts() {
    try {
      const { data } = await supabase
        .from('page_posts')
        .select('*')
        .eq('page_id', id)
        .order('created_at', { ascending: false })
      if (data) setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  async function checkFollowStatus() {
    try {
      const { data } = await supabase
        .from('page_followers')
        .select('id')
        .eq('page_id', id)
        .eq('user_id', session.user.id)
        .single()
      setIsFollowing(!!data)
    } catch (error) {
      console.error('Error checking follow status:', error)
    }
  }

  async function followPage() {
    try {
      await supabase
        .from('page_followers')
        .insert({ user_id: session.user.id, page_id: id })
      setIsFollowing(true)
      // Update follower count
      const { data } = await supabase
        .from('pages')
        .select('followers_count')
        .eq('id', id)
        .single()
      if (data) {
        await supabase
          .from('pages')
          .update({ followers_count: (data.followers_count || 0) + 1 })
          .eq('id', id)
      }
      loadPage()
    } catch (error) {
      console.error('Error following page:', error)
    }
  }

  async function unfollowPage() {
    try {
      await supabase
        .from('page_followers')
        .delete()
        .eq('user_id', session.user.id)
        .eq('page_id', id)
      setIsFollowing(false)
      // Update follower count
      const { data } = await supabase
        .from('pages')
        .select('followers_count')
        .eq('id', id)
        .single()
      if (data && data.followers_count > 0) {
        await supabase
          .from('pages')
          .update({ followers_count: data.followers_count - 1 })
          .eq('id', id)
      }
      loadPage()
    } catch (error) {
      console.error('Error unfollowing page:', error)
    }
  }

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    header: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb',
      textAlign: 'center'
    },
    pageAvatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '48px',
      margin: '0 auto 16px',
      overflow: 'hidden'
    },
    pageName: {
      fontSize: '32px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    pageCategory: {
      fontSize: '16px',
      color: '#6b7280',
      fontWeight: '700'
    },
    pageDescription: {
      fontSize: '16px',
      color: '#6b7280',
      fontWeight: '700',
      marginTop: '8px'
    },
    pageStats: {
      display: 'flex',
      justifyContent: 'center',
      gap: '24px',
      marginTop: '12px',
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700'
    },
    followBtn: {
      padding: '10px 32px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      marginTop: '16px'
    },
    unfollowBtn: {
      padding: '10px 32px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      marginTop: '16px'
    },
    postCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
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
    }
  }

  if (loading || !page) {
    return <div className="spinner" style={{ marginTop: '40px' }}></div>
  }

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div style={styles.pageAvatar}>
          <img src={page.avatar || `https://ui-avatars.com/api/?name=${(page.name?.[0] || 'P')}&background=000&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        </div>
        <div style={styles.pageName}>{page.name}</div>
        <div style={styles.pageCategory}>{page.category || 'General'}</div>
        <div style={styles.pageDescription}>{page.description}</div>
        <div style={styles.pageStats}>
          <span>👥 {page.followers_count || 0} followers</span>
        </div>
        {isFollowing ? (
          <button style={styles.unfollowBtn} onClick={unfollowPage}>Unfollow</button>
        ) : (
          <button style={styles.followBtn} onClick={followPage}>Follow</button>
        )}
      </div>

      {/* Posts */}
      {posts.map(post => (
        <div key={post.id} style={styles.postCard}>
          <div style={styles.postContent}>{post.content}</div>
          <div style={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  )
}