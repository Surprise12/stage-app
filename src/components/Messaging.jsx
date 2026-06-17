// src/components/Messaging.jsx - UPDATED WITH INLINE STYLES
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Messaging({ session }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [users, setUsers] = useState([])
  const [showNewChat, setShowNewChat] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typing, setTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadConversations()
    loadUsers()
    loadOnlineUsers()
    subscribeToPresence()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages()
      markMessagesAsRead()
      subscribeToMessages()
      scrollToBottom()
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadConversations() {
    try {
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:participant1_id (id, username, display_name, avatar_url, is_verified, last_seen),
          participant2:participant2_id (id, username, display_name, avatar_url, is_verified, last_seen)
        `)
        .or(`participant1_id.eq.${session.user.id},participant2_id.eq.${session.user.id}`)
        .order('last_message_at', { ascending: false })

      if (data) setConversations(data)
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  async function loadMessages() {
    try {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true })

      if (data) setMessages(data)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  async function markMessagesAsRead() {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', selectedConversation.id)
        .neq('sender_id', session.user.id)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  async function loadUsers() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .neq('id', session.user.id)
        .limit(20)
      if (data) setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  async function loadOnlineUsers() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .gt('last_seen', fiveMinutesAgo)
        .neq('id', session.user.id)
        .limit(10)
      if (data) setOnlineUsers(data)
    } catch (error) {
      console.error('Error loading online users:', error)
    }
  }

  function subscribeToPresence() {
    const subscription = supabase
      .channel('presence')
      .on('presence', { event: 'sync' }, () => {
        loadOnlineUsers()
      })
      .subscribe()

    const updateLastSeen = setInterval(async () => {
      try {
        await supabase
          .from('profiles')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', session.user.id)
      } catch (error) {
        console.error('Error updating last seen:', error)
      }
    }, 60000)

    return () => {
      subscription.unsubscribe()
      clearInterval(updateLastSeen)
    }
  }

  async function startConversation(userId) {
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant1_id.eq.${session.user.id},participant2_id.eq.${userId}),and(participant1_id.eq.${userId},participant2_id.eq.${session.user.id})`)
        .single()

      if (existing) {
        setSelectedConversation(existing)
      } else {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            participant1_id: session.user.id,
            participant2_id: userId
          })
          .select()
          .single()

        if (newConv) {
          setSelectedConversation(newConv)
          await loadConversations()
        }
      }
      setShowNewChat(false)
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return

    try {
      const { data } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: session.user.id,
          content: newMessage
        })
        .select()
        .single()

      if (data) {
        setMessages([...messages, data])
        setNewMessage('')
        
        await supabase
          .from('conversations')
          .update({ last_message: newMessage, last_message_at: new Date().toISOString() })
          .eq('id', selectedConversation.id)
        
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('user_id', session.user.id)
          .eq('conversation_id', selectedConversation.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  function sendReaction(reaction) {
    setNewMessage(reaction + ' ')
    document.getElementById('messageInput')?.focus()
  }

  async function sendTypingIndicator() {
    if (typingTimeout) clearTimeout(typingTimeout)
    
    if (!typing) {
      setTyping(true)
      try {
        await supabase
          .from('typing_indicators')
          .upsert({
            user_id: session.user.id,
            conversation_id: selectedConversation.id,
            is_typing: true,
            updated_at: new Date().toISOString()
          })
      } catch (error) {
        console.error('Error sending typing indicator:', error)
      }
    }
    
    setTypingTimeout(setTimeout(async () => {
      setTyping(false)
      try {
        await supabase
          .from('typing_indicators')
          .delete()
          .eq('user_id', session.user.id)
          .eq('conversation_id', selectedConversation.id)
      } catch (error) {
        console.error('Error clearing typing indicator:', error)
      }
    }, 1000))
  }

  function subscribeToMessages() {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
        if (payload.new.sender_id !== session.user.id) {
          markMessagesAsRead()
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, (payload) => {
        if (payload.new.is_read && payload.new.sender_id === session.user.id) {
          setMessages(prev => prev.map(m => 
            m.id === payload.new.id ? { ...m, is_read: true } : m
          ))
        }
      })
      .subscribe()

    const typingSubscription = supabase
      .channel('typing')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'typing_indicators',
        filter: `conversation_id=eq.${selectedConversation.id}`
      }, (payload) => {
        if (payload.new.user_id !== session.user.id) {
          showTypingIndicator(payload.new.user_id)
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
      typingSubscription.unsubscribe()
    }
  }

  function showTypingIndicator(userId) {
    const other = getOtherParticipant(selectedConversation)
    if (other?.id === userId) {
      const typingElement = document.getElementById('typingIndicator')
      if (typingElement) {
        typingElement.style.display = 'block'
        setTimeout(() => {
          typingElement.style.display = 'none'
        }, 1500)
      }
    }
  }

  function getOtherParticipant(conversation) {
    if (!conversation) return null
    if (conversation.participant1?.id === session.user.id) {
      return conversation.participant2
    }
    return conversation.participant1
  }

  function isUserOnline(userId) {
    return onlineUsers.some(u => u.id === userId)
  }

  function formatTime(date) {
    if (!date) return ''
    const now = new Date()
    const msgDate = new Date(date)
    const diffHours = (now - msgDate) / (1000 * 60 * 60)
    
    if (diffHours < 24) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffHours < 48) {
      return 'Yesterday'
    } else {
      return msgDate.toLocaleDateString()
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const other = getOtherParticipant(conv)
    if (searchQuery) {
      return other?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             other?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    }
    if (filterType === 'unread') {
      return conv.unread_count > 0
    }
    return true
  })

  const unreadCount = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)

  // Inline styles
  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'minmax(300px, 350px) 1fr',
      gap: 0,
      background: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      minHeight: '600px',
      border: '1px solid #ddd',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    sidebar: {
      borderRight: '1px solid #eee',
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '600px'
    },
    sidebarHeader: {
      padding: '20px',
      borderBottom: '1px solid #eee'
    },
    headerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: '700'
    },
    headerBadge: {
      background: '#ff4444',
      color: 'white',
      padding: '2px 8px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700'
    },
    newBtn: {
      padding: '6px 14px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      background: '#f0f2f5',
      borderRadius: '40px',
      padding: '8px 16px',
      gap: '8px',
      width: '100%',
      marginBottom: '12px',
      border: '1px solid #ddd',
      transition: 'all 0.3s'
    },
    searchIcon: {
      color: '#666',
      fontSize: '14px'
    },
    searchInput: {
      border: 'none',
      background: 'transparent',
      outline: 'none',
      fontSize: '14px',
      color: '#000',
      width: '100%',
      fontWeight: '700'
    },
    filters: {
      display: 'flex',
      gap: '8px'
    },
    filterTab: {
      padding: '4px 12px',
      borderRadius: '30px',
      fontWeight: '700',
      fontSize: '12px',
      color: '#666',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    filterTabActive: {
      background: '#000',
      color: 'white'
    },
    onlineSection: {
      padding: '12px 20px',
      borderBottom: '1px solid #eee'
    },
    onlineTitle: {
      fontSize: '12px',
      fontWeight: '700',
      color: '#666',
      marginBottom: '8px'
    },
    onlineList: {
      display: 'flex',
      gap: '12px',
      overflowX: 'auto'
    },
    onlineItem: {
      textAlign: 'center',
      cursor: 'pointer',
      flexShrink: 0
    },
    onlineAvatarWrapper: {
      position: 'relative',
      width: '48px',
      height: '48px',
      marginBottom: '4px'
    },
    onlineAvatar: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    onlineDot: {
      position: 'absolute',
      bottom: '2px',
      right: '2px',
      width: '12px',
      height: '12px',
      background: '#31a24c',
      borderRadius: '50%',
      border: '2px solid white'
    },
    onlineName: {
      fontSize: '10px',
      whiteSpace: 'nowrap',
      fontWeight: '700'
    },
    newChatSection: {
      padding: '16px',
      borderBottom: '1px solid #eee',
      background: '#fafafa'
    },
    newChatTitle: {
      marginBottom: '12px',
      fontSize: '14px',
      fontWeight: '700'
    },
    userList: {
      maxHeight: '300px',
      overflowY: 'auto'
    },
    userItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px',
      cursor: 'pointer',
      borderRadius: '12px',
      transition: 'background 0.2s'
    },
    userAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    userName: {
      fontWeight: '700'
    },
    userUsername: {
      fontSize: '11px',
      color: '#888'
    },
    verifiedBadge: {
      fontSize: '10px',
      color: '#1da1f2',
      marginLeft: 'auto'
    },
    conversationList: {
      flex: 1,
      overflowY: 'auto'
    },
    conversationItem: {
      padding: '12px 16px',
      cursor: 'pointer',
      borderBottom: '1px solid #f0f2f5',
      transition: 'background 0.2s'
    },
    conversationItemActive: {
      background: '#f0f2f5'
    },
    conversationRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    conversationAvatarWrapper: {
      position: 'relative'
    },
    conversationAvatar: {
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    conversationDot: {
      position: 'absolute',
      bottom: '2px',
      right: '2px',
      width: '12px',
      height: '12px',
      background: '#31a24c',
      borderRadius: '50%',
      border: '2px solid white'
    },
    conversationInfo: {
      flex: 1
    },
    conversationTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    conversationName: {
      fontWeight: '700',
      fontSize: '14px'
    },
    conversationTime: {
      fontSize: '10px',
      color: '#999'
    },
    conversationLastMsg: {
      fontSize: '12px',
      color: '#666',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },
    unreadDot: {
      width: '10px',
      height: '10px',
      background: '#7c3aed',
      borderRadius: '50%',
      flexShrink: 0
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#888'
    },
    emptyIcon: {
      fontSize: '32px',
      color: '#ccc',
      display: 'block',
      marginBottom: '12px'
    },
    chatArea: {
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      background: 'white'
    },
    chatHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    chatHeaderLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    chatHeaderAvatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    chatHeaderName: {
      fontWeight: '700',
      fontSize: '14px'
    },
    chatHeaderStatus: {
      fontSize: '11px',
      color: '#999'
    },
    chatHeaderActions: {
      display: 'flex',
      gap: '16px'
    },
    chatHeaderIcon: {
      cursor: 'pointer',
      fontSize: '16px',
      color: '#666',
      transition: 'color 0.2s'
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px',
      background: '#f5f5f5',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    messageRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      gap: '8px'
    },
    messageRowOwn: {
      justifyContent: 'flex-end'
    },
    messageRowOther: {
      justifyContent: 'flex-start'
    },
    messageAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      alignSelf: 'flex-start',
      objectFit: 'cover'
    },
    messageAvatarPlaceholder: {
      width: '32px',
      flexShrink: 0
    },
    messageBubble: {
      maxWidth: '70%'
    },
    messageBubbleOwn: {
      background: '#7c3aed',
      color: 'white',
      padding: '10px 14px',
      borderRadius: '18px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      wordBreak: 'break-word'
    },
    messageBubbleOther: {
      background: 'white',
      color: '#333',
      padding: '10px 14px',
      borderRadius: '18px',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
      wordBreak: 'break-word'
    },
    messageTime: {
      fontSize: '10px',
      color: '#999',
      marginTop: '4px',
      display: 'flex',
      gap: '4px'
    },
    messageTimeOwn: {
      justifyContent: 'flex-end'
    },
    messageTimeOther: {
      justifyContent: 'flex-start'
    },
    readReceipt: {
      color: '#7c3aed'
    },
    typingIndicator: {
      display: 'none',
      fontSize: '12px',
      color: '#888',
      marginLeft: '48px'
    },
    inputArea: {
      padding: '16px 20px',
      borderTop: '1px solid #eee',
      background: 'white',
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    attachBtn: {
      cursor: 'pointer',
      fontSize: '20px',
      color: '#7c3aed',
      background: 'none',
      border: 'none'
    },
    messageInput: {
      flex: 1,
      borderRadius: '20px',
      padding: '10px 16px',
      border: '1px solid #ddd',
      outline: 'none',
      fontSize: '14px',
      fontWeight: '700'
    },
    reactionBtn: {
      cursor: 'pointer',
      fontSize: '18px',
      background: 'none',
      border: 'none',
      transition: 'transform 0.2s'
    },
    sendBtn: {
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s'
    },
    noChatSelected: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#888',
      textAlign: 'center'
    },
    noChatIcon: {
      fontSize: '48px',
      color: '#ccc',
      marginBottom: '16px'
    },
    noChatText: {
      fontSize: '16px',
      marginBottom: '8px'
    },
    noChatSubtext: {
      fontSize: '12px'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {/* Conversations List */}
        <div style={styles.sidebar}>
          {/* Header */}
          <div style={styles.sidebarHeader}>
            <div style={styles.headerRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={styles.headerTitle}>Messages</span>
                {unreadCount > 0 && (
                  <span style={styles.headerBadge}>{unreadCount}</span>
                )}
              </div>
              <button 
                style={styles.newBtn}
                onClick={() => setShowNewChat(!showNewChat)}
                onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
              >
                <i className="fas fa-plus"></i> New
              </button>
            </div>
            
            {/* Search */}
            <div style={styles.searchBox}>
              <i className="fas fa-search" style={styles.searchIcon}></i>
              <input 
                type="text" 
                style={styles.searchInput}
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filters */}
            <div style={styles.filters}>
              <span 
                style={{...styles.filterTab, ...(filterType === 'all' ? styles.filterTabActive : {})}}
                onClick={() => setFilterType('all')}
              >
                All
              </span>
              <span 
                style={{...styles.filterTab, ...(filterType === 'unread' ? styles.filterTabActive : {})}}
                onClick={() => setFilterType('unread')}
              >
                Unread
              </span>
            </div>
          </div>

          {/* Online Now */}
          <div style={styles.onlineSection}>
            <div style={styles.onlineTitle}>ONLINE NOW</div>
            <div style={styles.onlineList}>
              {onlineUsers.map(user => (
                <div key={user.id} style={styles.onlineItem} onClick={() => startConversation(user.id)}>
                  <div style={styles.onlineAvatarWrapper}>
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                      style={styles.onlineAvatar} 
                      alt="" 
                    />
                    <span style={styles.onlineDot}></span>
                  </div>
                  <div style={styles.onlineName}>
                    {user.display_name?.split(' ')[0] || user.username?.substring(0, 8)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Chat Section */}
          {showNewChat && (
            <div style={styles.newChatSection}>
              <h4 style={styles.newChatTitle}>Start a new chat</h4>
              <div style={styles.userList}>
                {users.map(user => (
                  <div 
                    key={user.id} 
                    style={styles.userItem}
                    onClick={() => startConversation(user.id)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0f2f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                      style={styles.userAvatar} 
                      alt="avatar" 
                    />
                    <div>
                      <div style={styles.userName}>{user.display_name || user.username}</div>
                      <div style={styles.userUsername}>@{user.username}</div>
                    </div>
                    {user.is_verified && <span style={styles.verifiedBadge}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div style={styles.conversationList}>
            {filteredConversations.map(conv => {
              const other = getOtherParticipant(conv)
              const isOnline = isUserOnline(other?.id)
              const hasUnread = conv.unread_count > 0
              
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setSelectedConversation(conv)}
                  style={{
                    ...styles.conversationItem,
                    ...(selectedConversation?.id === conv.id ? styles.conversationItemActive : {})
                  }}
                  onMouseEnter={(e) => {
                    if (selectedConversation?.id !== conv.id) {
                      e.currentTarget.style.background = '#f8f9fa'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedConversation?.id !== conv.id) {
                      e.currentTarget.style.background = 'white'
                    }
                  }}
                >
                  <div style={styles.conversationRow}>
                    <div style={styles.conversationAvatarWrapper}>
                      <img 
                        src={other?.avatar_url || `https://ui-avatars.com/api/?name=${(other?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                        style={styles.conversationAvatar} 
                        alt="avatar" 
                      />
                      {isOnline && <span style={styles.conversationDot}></span>}
                    </div>
                    <div style={styles.conversationInfo}>
                      <div style={styles.conversationTop}>
                        <div style={styles.conversationName}>
                          {other?.display_name || other?.username}
                          {other?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                        </div>
                        <div style={styles.conversationTime}>
                          {conv.last_message_at && formatTime(conv.last_message_at)}
                        </div>
                      </div>
                      <div style={styles.conversationLastMsg}>
                        {conv.last_message?.substring(0, 50)}
                      </div>
                    </div>
                    {hasUnread && <div style={styles.unreadDot}></div>}
                  </div>
                </div>
              )
            })}
            {filteredConversations.length === 0 && (
              <div style={styles.emptyState}>
                <i className="fas fa-comments" style={styles.emptyIcon}></i>
                <p>No conversations yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Start a new chat to connect with others</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={styles.chatArea}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderLeft}>
                  <img 
                    src={getOtherParticipant(selectedConversation)?.avatar_url || `https://ui-avatars.com/api/?name=${(getOtherParticipant(selectedConversation)?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                    style={styles.chatHeaderAvatar} 
                    alt="avatar" 
                  />
                  <div>
                    <div style={styles.chatHeaderName}>
                      {getOtherParticipant(selectedConversation)?.display_name || getOtherParticipant(selectedConversation)?.username}
                    </div>
                    <div style={styles.chatHeaderStatus}>
                      {isUserOnline(getOtherParticipant(selectedConversation)?.id) ? 'Active now' : 'Offline'}
                    </div>
                  </div>
                </div>
                <div style={styles.chatHeaderActions}>
                  <i className="fas fa-phone" style={styles.chatHeaderIcon} onClick={() => alert('Voice call coming soon')}></i>
                  <i className="fas fa-video" style={styles.chatHeaderIcon} onClick={() => alert('Video call coming soon')}></i>
                  <i className="fas fa-info-circle" style={styles.chatHeaderIcon} onClick={() => alert('Chat info')}></i>
                </div>
              </div>
              
              {/* Messages Area */}
              <div style={styles.messagesArea}>
                {messages.map((msg, index) => {
                  const isOwn = msg.sender_id === session.user.id
                  const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_id !== msg.sender_id)
                  
                  return (
                    <div key={msg.id} style={{...styles.messageRow, ...(isOwn ? styles.messageRowOwn : styles.messageRowOther)}}>
                      {!isOwn && showAvatar && (
                        <img 
                          src={getOtherParticipant(selectedConversation)?.avatar_url || `https://ui-avatars.com/api/?name=${(getOtherParticipant(selectedConversation)?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                          style={styles.messageAvatar} 
                          alt="avatar" 
                        />
                      )}
                      {!isOwn && !showAvatar && <div style={styles.messageAvatarPlaceholder}></div>}
                      <div style={styles.messageBubble}>
                        <div style={isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther}>
                          {msg.content}
                        </div>
                        <div style={{...styles.messageTime, ...(isOwn ? styles.messageTimeOwn : styles.messageTimeOther)}}>
                          {formatTime(msg.created_at)}
                          {isOwn && msg.is_read && <span style={styles.readReceipt}>✓✓</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div id="typingIndicator" style={styles.typingIndicator}>
                  Typing...
                </div>
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input Area */}
              <div style={styles.inputArea}>
                <button style={styles.attachBtn} onClick={() => alert('Attach file coming soon')}>
                  <i className="fas fa-plus-circle"></i>
                </button>
                <input 
                  type="text" 
                  id="messageInput"
                  style={styles.messageInput}
                  placeholder="Aa" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  onKeyUp={sendTypingIndicator}
                />
                <button style={styles.reactionBtn} onClick={() => sendReaction('❤️')}>
                  ❤️
                </button>
                <button style={styles.reactionBtn} onClick={() => sendReaction('👍')}>
                  👍
                </button>
                <button 
                  style={styles.sendBtn}
                  onClick={sendMessage}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </>
          ) : (
            <div style={styles.noChatSelected}>
              <i className="fas fa-envelope" style={styles.noChatIcon}></i>
              <p style={styles.noChatText}>Select a conversation to start messaging</p>
              <p style={styles.noChatSubtext}>or start a new chat using the + button</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}