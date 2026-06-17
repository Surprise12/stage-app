// src/pages/GroupDetail.jsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function GroupDetail({ session }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [posts, setPosts] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    loadGroup()
    loadPosts()
    loadMembers()
    checkMembership()
  }, [id])

  async function loadGroup() {
    try {
      const { data } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .single()
      if (data) setGroup(data)
    } catch (error) {
      console.error('Error loading group:', error)
    }
  }

  async function loadPosts() {
    try {
      const { data } = await supabase
        .from('group_posts')
        .select('*, user:user_id(id, username, display_name, avatar_url)')
        .eq('group_id', id)
        .order('created_at', { ascending: false })
      if (data) setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }

  async function loadMembers() {
    try {
      const { data } = await supabase
        .from('group_members')
        .select('user:user_id(id, username, display_name, avatar_url)')
        .eq('group_id', id)
        .limit(10)
      if (data) setMembers(data.map(m => m.user))
    } catch (error) {
      console.error('Error loading members:', error)
    }
  }

  async function checkMembership() {
    try {
      const { data } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', id)
        .eq('user_id', session.user.id)
        .single()
      setIsMember(!!data)
    } catch (error) {
      console.error('Error checking membership:', error)
    }
  }

  async function joinGroup() {
    try {
      await supabase
        .from('group_members')
        .insert({ user_id: session.user.id, group_id: id })
      setIsMember(true)
      loadMembers()
    } catch (error) {
      console.error('Error joining group:', error)
    }
  }

  async function leaveGroup() {
    try {
      await supabase
        .from('group_members')
        .delete()
        .eq('user_id', session.user.id)
        .eq('group_id', id)
      setIsMember(false)
      loadMembers()
    } catch (error) {
      console.error('Error leaving group:', error)
    }
  }

  async function createPost() {
    if (!newPost.trim()) return
    try {
      await supabase
        .from('group_posts')
        .insert({
          group_id: id,
          user_id: session.user.id,
          content: newPost
        })
      setNewPost('')
      loadPosts()
    } catch (error) {
      console.error('Error creating post:', error)
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
      border: '1px solid #e5e7eb'
    },
    groupName: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '4px'
    },
    groupDescription: {
      fontSize: '16px',
      color: '#6b7280',
      fontWeight: '700'
    },
    groupStats: {
      display: 'flex',
      gap: '16px',
      marginTop: '12px',
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700'
    },
    joinBtn: {
      padding: '10px 24px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      marginTop: '12px'
    },
    leaveBtn: {
      padding: '10px 24px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      marginTop: '12px'
    },
    postBox: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    postInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '60px',
      resize: 'vertical',
      fontFamily: 'inherit'
    },
    postBtn: {
      padding: '10px 24px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      marginTop: '8px'
    },
    postCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    postUser: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    postAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      background: '#7c3aed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '16px',
      overflow: 'hidden'
    },
    postUserName: {
      fontWeight: '700'
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

  if (loading || !group) {
    return <div className="spinner" style={{ marginTop: '40px' }}></div>
  }

  return (
    <div style={styles.container}>
      {/* Group Header */}
      <div style={styles.header}>
        <div style={styles.groupName}>{group.name}</div>
        <div style={styles.groupDescription}>{group.description}</div>
        <div style={styles.groupStats}>
          <span>👥 {group.members_count || 0} members</span>
          <span>{group.privacy === 'public' ? '🌍 Public' : '🔒 Private'}</span>
        </div>
        {isMember ? (
          <button style={styles.leaveBtn} onClick={leaveGroup}>Leave Group</button>
        ) : (
          <button style={styles.joinBtn} onClick={joinGroup}>Join Group</button>
        )}
      </div>

      {/* Create Post */}
      {isMember && (
        <div style={styles.postBox}>
          <textarea 
            style={styles.postInput}
            placeholder="What's on your mind?"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
          <button style={styles.postBtn} onClick={createPost}>Post</button>
        </div>
      )}

      {/* Posts */}
      {posts.map(post => (
        <div key={post.id} style={styles.postCard}>
          <div style={styles.postUser}>
            <div style={styles.postAvatar}>
              <img src={post.user?.avatar_url || `https://ui-avatars.com/api/?name=${(post.user?.username?.[0] || 'U')}&background=000&color=fff`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
            <div>
              <div style={styles.postUserName}>{post.user?.display_name || post.user?.username}</div>
              <div style={styles.postTime}>{new Date(post.created_at).toLocaleDateString()}</div>
            </div>
          </div>
          <div style={styles.postContent}>{post.content}</div>
        </div>
      ))}
    </div>
  )
}