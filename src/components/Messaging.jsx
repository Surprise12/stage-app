// src/components/Messaging.jsx
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
  }

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', selectedConversation.id)
      .order('created_at', { ascending: true })

    if (data) setMessages(data)
  }

  async function markMessagesAsRead() {
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', selectedConversation.id)
      .neq('sender_id', session.user.id)
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, is_verified')
      .neq('id', session.user.id)
      .limit(20)
    if (data) setUsers(data)
  }

  async function loadOnlineUsers() {
    // Get users with recent activity (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .gt('last_seen', fiveMinutesAgo)
      .neq('id', session.user.id)
      .limit(10)
    if (data) setOnlineUsers(data)
  }

  function subscribeToPresence() {
    const subscription = supabase
      .channel('presence')
      .on('presence', { event: 'sync' }, () => {
        // Update online users list
        loadOnlineUsers()
      })
      .subscribe()

    // Update user's last seen
    const updateLastSeen = setInterval(async () => {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', session.user.id)
    }, 60000) // Update every minute

    return () => {
      subscription.unsubscribe()
      clearInterval(updateLastSeen)
    }
  }

  async function startConversation(userId) {
    // Check if conversation exists
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
  }

  async function sendMessage() {
    if (!newMessage.trim()) return

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
      
      // Update last message in conversation
      await supabase
        .from('conversations')
        .update({ last_message: newMessage, last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id)
      
      // Send typing notification
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('user_id', session.user.id)
        .eq('conversation_id', selectedConversation.id)
    }
  }

  async function sendReaction(reaction) {
    setNewMessage(reaction + ' ')
    document.getElementById('messageInput')?.focus()
  }

  async function sendTypingIndicator() {
    if (typingTimeout) clearTimeout(typingTimeout)
    
    if (!typing) {
      setTyping(true)
      await supabase
        .from('typing_indicators')
        .upsert({
          user_id: session.user.id,
          conversation_id: selectedConversation.id,
          is_typing: true,
          updated_at: new Date().toISOString()
        })
    }
    
    setTypingTimeout(setTimeout(async () => {
      setTyping(false)
      await supabase
        .from('typing_indicators')
        .delete()
        .eq('user_id', session.user.id)
        .eq('conversation_id', selectedConversation.id)
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
          // Update read receipts
          setMessages(prev => prev.map(m => 
            m.id === payload.new.id ? { ...m, is_read: true } : m
          ))
        }
      })
      .subscribe()

    // Subscribe to typing indicators
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
    if (conversation.participant1?.id === session.user.id) {
      return conversation.participant2
    }
    return conversation.participant1
  }

  function isUserOnline(userId) {
    return onlineUsers.some(u => u.id === userId)
  }

  function formatTime(date) {
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

  return (
    <div className="container-wide" style={{ marginTop: '30px', maxWidth: '1200px', margin: '30px auto 0' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(300px, 350px) 1fr', 
        gap: '0', 
        background: 'white', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        minHeight: '600px',
        border: '1px solid #ddd',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        {/* Conversations List */}
        <div style={{ borderRight: '1px solid #eee', background: 'white', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Messages</h2>
              {unreadCount > 0 && (
                <span className="badge" style={{ background: '#ff4444', color: 'white', position: 'static', padding: '2px 8px' }}>
                  {unreadCount}
                </span>
              )}
              <button className="btn btn-primary btn-small" onClick={() => setShowNewChat(!showNewChat)}>
                <i className="fas fa-plus"></i> New
              </button>
            </div>
            
            {/* Search */}
            <div className="search-box" style={{ width: '100%', marginBottom: '12px' }}>
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <span 
                className={`story-tab ${filterType === 'all' ? 'active' : ''}`} 
                onClick={() => setFilterType('all')}
                style={{ padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
              >
                All
              </span>
              <span 
                className={`story-tab ${filterType === 'unread' ? 'active' : ''}`} 
                onClick={() => setFilterType('unread')}
                style={{ padding: '4px 12px', fontSize: '12px', cursor: 'pointer' }}
              >
                Unread
              </span>
            </div>
          </div>

          {/* Online Now */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>ONLINE NOW</div>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
              {onlineUsers.map(user => (
                <div key={user.id} onClick={() => startConversation(user.id)} style={{ textAlign: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: '48px', height: '48px', marginBottom: '4px' }}>
                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                    <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', background: '#31a24c', borderRadius: '50%', border: '2px solid white' }}></span>
                  </div>
                  <div style={{ fontSize: '10px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                    {user.display_name?.split(' ')[0] || user.username?.substring(0, 8)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* New Chat Section */}
          {showNewChat && (
            <div style={{ padding: '16px', borderBottom: '1px solid #eee', background: '#fafafa' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Start a new chat</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {users.map(user => (
                  <div key={user.id} onClick={() => startConversation(user.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', cursor: 'pointer', borderRadius: '12px', transition: 'background 0.2s' }}>
                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${(user.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{user.display_name || user.username}</div>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>@{user.username}</div>
                    </div>
                    {user.is_verified && <span style={{ fontSize: '10px', color: '#1da1f2', marginLeft: 'auto' }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.map(conv => {
              const other = getOtherParticipant(conv)
              const isOnline = isUserOnline(other?.id)
              const hasUnread = conv.unread_count > 0
              
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setSelectedConversation(conv)}
                  className={`chat-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                  style={{ 
                    padding: '12px 16px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #f0f2f5',
                    background: selectedConversation?.id === conv.id ? '#f0f2f5' : 'white',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <img src={other?.avatar_url || `https://ui-avatars.com/api/?name=${(other?.username?.[0] || 'U')}&background=7c3aed&color=fff`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} alt="avatar" />
                      {isOnline && <span style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', background: '#31a24c', borderRadius: '50%', border: '2px solid white' }}></span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                          {other?.display_name || other?.username}
                          {other?.is_verified && <span style={{ color: '#1da1f2', marginLeft: '4px' }}>✓</span>}
                        </div>
                        <div style={{ fontSize: '10px', color: '#999' }}>
                          {conv.last_message_at && formatTime(conv.last_message_at)}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.last_message?.substring(0, 50)}
                      </div>
                    </div>
                    {hasUnread && (
                      <div style={{ 
                        width: '10px', 
                        height: '10px', 
                        background: '#7c3aed', 
                        borderRadius: '50%',
                        flexShrink: 0
                      }}></div>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredConversations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                <i className="fas fa-comments" style={{ fontSize: '32px', marginBottom: '12px', display: 'block', color: '#ccc' }}></i>
                <p>No conversations yet</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Start a new chat to connect with others</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '600px', background: 'white' }}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img 
                    src={getOtherParticipant(selectedConversation)?.avatar_url || `https://ui-avatars.com/api/?name=${(getOtherParticipant(selectedConversation)?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                    alt="avatar" 
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }} id="chatHeaderName">
                      {getOtherParticipant(selectedConversation)?.display_name || getOtherParticipant(selectedConversation)?.username}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999' }} id="chatHeaderStatus">
                      {isUserOnline(getOtherParticipant(selectedConversation)?.id) ? 'Active now' : 'Offline'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <i className="fas fa-phone" style={{ cursor: 'pointer', fontSize: '16px', color: '#666' }} onClick={() => alert('Voice call coming soon')}></i>
                  <i className="fas fa-video" style={{ cursor: 'pointer', fontSize: '16px', color: '#666' }} onClick={() => alert('Video call coming soon')}></i>
                  <i className="fas fa-info-circle" style={{ cursor: 'pointer', fontSize: '16px', color: '#666' }} onClick={() => alert('Chat info')}></i>
                </div>
              </div>
              
              {/* Messages Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f5f5f5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, index) => {
                  const isOwn = msg.sender_id === session.user.id
                  const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.sender_id !== msg.sender_id)
                  
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                      {!isOwn && showAvatar && (
                        <img 
                          src={getOtherParticipant(selectedConversation)?.avatar_url || `https://ui-avatars.com/api/?name=${(getOtherParticipant(selectedConversation)?.username?.[0] || 'U')}&background=7c3aed&color=fff`} 
                          style={{ width: '32px', height: '32px', borderRadius: '50%', alignSelf: 'flex-start' }} 
                          alt="avatar" 
                        />
                      )}
                      {!isOwn && !showAvatar && <div style={{ width: '32px' }}></div>}
                      <div style={{ maxWidth: '70%' }}>
                        <div style={{ 
                          background: isOwn ? '#7c3aed' : 'white', 
                          color: isOwn ? 'white' : '#333', 
                          padding: '10px 14px', 
                          borderRadius: '18px', 
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          wordBreak: 'break-word'
                        }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: '10px', color: '#999', marginTop: '4px', textAlign: isOwn ? 'right' : 'left', display: 'flex', gap: '4px', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
                          {formatTime(msg.created_at)}
                          {isOwn && msg.is_read && <span style={{ color: '#7c3aed' }}>✓✓</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div id="typingIndicator" style={{ display: 'none', fontSize: '12px', color: '#888', marginLeft: '48px' }}>
                  Typing...
                </div>
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input Area */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #eee', background: 'white', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <i className="fas fa-plus-circle" style={{ cursor: 'pointer', fontSize: '20px', color: '#7c3aed' }} onClick={() => alert('Attach file coming soon')}></i>
                <input 
                  type="text" 
                  id="messageInput"
                  className="input" 
                  placeholder="Aa" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  onKeyUp={sendTypingIndicator}
                  style={{ flex: 1, borderRadius: '20px', padding: '10px 16px' }}
                />
                <i className="fas fa-heart" style={{ cursor: 'pointer', fontSize: '18px', color: '#f5576c' }} onClick={() => sendReaction('❤️')}></i>
                <i className="fas fa-thumbs-up" style={{ cursor: 'pointer', fontSize: '18px', color: '#7c3aed' }} onClick={() => sendReaction('👍')}></i>
                <button onClick={sendMessage} style={{ background: '#7c3aed', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888', textAlign: 'center' }}>
              <i className="fas fa-envelope" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p>Select a conversation to start messaging</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>or start a new chat using the + button</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}