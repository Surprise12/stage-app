import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Messaging({ session }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [users, setUsers] = useState([])
  const [showNewChat, setShowNewChat] = useState(false)

  useEffect(() => {
    loadConversations()
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages()
      subscribeToMessages()
    }
  }, [selectedConversation])

  async function loadConversations() {
    const { data } = await supabase
      .from('conversations')
      .select(`
        *,
        participant1:participant1_id (id, username, display_name, avatar_url),
        participant2:participant2_id (id, username, display_name, avatar_url)
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

    if (data) {
      setMessages(data)
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', selectedConversation.id)
        .neq('sender_id', session.user.id)
    }
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .neq('id', session.user.id)
      .limit(20)

    if (data) setUsers(data)
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
    }
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
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }

  function getOtherParticipant(conversation) {
    if (conversation.participant1?.id === session.user.id) {
      return conversation.participant2
    }
    return conversation.participant1
  }

  return (
    <div className="container-wide" style={{ marginTop: '30px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', background: '#141414', borderRadius: '24px', overflow: 'hidden', minHeight: '600px' }}>
        {/* Conversations List */}
        <div style={{ borderRight: '1px solid #2a2a2a', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Messages</h2>
            <button className="btn btn-primary btn-small" onClick={() => setShowNewChat(!showNewChat)}>+ New</button>
          </div>

          {showNewChat && (
            <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
              <h4>Start a new chat</h4>
              {users.map(user => (
                <div key={user.id} onClick={() => startConversation(user.id)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '12px' }}>
                  <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.username[0]}&background=7c3aed&color=fff`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="avatar" />
                  <div>
                    <div>{user.display_name || user.username}</div>
                    <div style={{ fontSize: '0.7rem', color: '#888' }}>@{user.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {conversations.map(conv => {
            const other = getOtherParticipant(conv)
            return (
              <div key={conv.id} onClick={() => setSelectedConversation(conv)} style={{ padding: '16px', cursor: 'pointer', borderRadius: '16px', background: selectedConversation?.id === conv.id ? 'rgba(124,58,237,0.15)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={other?.avatar_url || `https://ui-avatars.com/api/?name=${other?.username[0] || 'U'}&background=7c3aed&color=fff`} style={{ width: '48px', height: '48px', borderRadius: '50%' }} alt="avatar" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{other?.display_name || other?.username}</div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{conv.last_message?.substring(0, 40)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chat Area */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
          {selectedConversation ? (
            <>
              <div style={{ padding: '20px', borderBottom: '1px solid #2a2a2a' }}>
                <h3>{getOtherParticipant(selectedConversation)?.display_name}</h3>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender_id === session.user.id ? 'flex-end' : 'flex-start', marginBottom: '16px' }}>
                    <div style={{ maxWidth: '70%', padding: '12px 16px', borderRadius: '20px', background: msg.sender_id === session.user.id ? '#7c3aed' : '#1f1f1f' }}>
                      {msg.content}
                      <div style={{ fontSize: '0.6rem', opacity: 0.7, marginTop: '4px' }}>{new Date(msg.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ padding: '20px', borderTop: '1px solid #2a2a2a', display: 'flex', gap: '12px' }}>
                <input type="text" className="input-modern" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
                <button className="btn btn-primary" onClick={sendMessage}>Send</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  )
}