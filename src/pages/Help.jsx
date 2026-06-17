// src/pages/Help.jsx - FIXED VERSION
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function Help({ session }) {
  const [activeFaq, setActiveFaq] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [isAdminOnline, setIsAdminOnline] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' })
  const messagesEndRef = useRef(null)
  const chatIntervalRef = useRef(null)

  const faqs = [
    {
      id: 1,
      category: 'getting-started',
      question: 'How do I create a post?',
      answer: 'Click on the "Create Post" box at the top of your feed. You can add text, images, and tags. Then click "Post" to share it with your followers.'
    },
    {
      id: 2,
      category: 'getting-started',
      question: 'How do I create an account?',
      answer: 'Click on "Sign Up" on the login page. Enter your email, username, and password. You\'ll receive a confirmation email to verify your account.'
    },
    {
      id: 3,
      category: 'verification',
      question: 'How do I get verified?',
      answer: 'Go to Settings → Verification and submit a request. You\'ll need to provide links to your music and explain why you should be verified. Our team will review your application within 48 hours.'
    },
    {
      id: 4,
      category: 'verification',
      question: 'What are the requirements for verification?',
      answer: 'You need at least 1000 followers, original content, and a valid music profile (Spotify, Apple Music, SoundCloud, etc.).'
    },
    {
      id: 5,
      category: 'monetization',
      question: 'How do I monetize my content?',
      answer: 'Upgrade to the Pro or Creator Pro plan to access monetization tools, fan subscriptions, virtual concerts, and merchandise sales.'
    },
    {
      id: 6,
      category: 'monetization',
      question: 'What are the platform fees?',
      answer: 'Free users pay 15% transaction fees. Pro users pay 8%. Creator Pro users enjoy 0% transaction fees.'
    },
    {
      id: 7,
      category: 'collaboration',
      question: 'How do I collaborate with other artists?',
      answer: 'Use the Collaboration Finder to discover artists with similar genres and styles. Send them a collaboration request and start creating together!'
    },
    {
      id: 8,
      category: 'collaboration',
      question: 'How do I find collaborators?',
      answer: 'Go to the Collaborations page or use the AI Collaboration Finder in the sidebar to get personalized recommendations based on your music style.'
    },
    {
      id: 9,
      category: 'safety',
      question: 'How do I report inappropriate content?',
      answer: 'Click the three dots on any post or video and select "Report". Our moderation team will review it within 24 hours.'
    },
    {
      id: 10,
      category: 'safety',
      question: 'How do I block a user?',
      answer: 'Go to the user\'s profile, click the three dots, and select "Block User". They will no longer be able to interact with you.'
    },
    {
      id: 11,
      category: 'technical',
      question: 'Why is my video not uploading?',
      answer: 'Make sure your video is under 500MB and in a supported format (MP4, MOV, AVI). Check your internet connection and try again.'
    },
    {
      id: 12,
      category: 'technical',
      question: 'How do I change my password?',
      answer: 'Go to Settings → Account → Change Password. Enter your current password and your new password to update it.'
    }
  ]

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'verification', label: 'Verification' },
    { id: 'monetization', label: 'Monetization' },
    { id: 'collaboration', label: 'Collaboration' },
    { id: 'safety', label: 'Safety & Security' },
    { id: 'technical', label: 'Technical Support' }
  ]

  useEffect(() => {
    if (showChat) {
      loadChatMessages()
      checkAdminStatus()
      chatIntervalRef.current = setInterval(loadChatMessages, 10000)
    }
    return () => {
      if (chatIntervalRef.current) {
        clearInterval(chatIntervalRef.current)
      }
    }
  }, [showChat])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function loadChatMessages() {
    try {
      // Check if table exists first
      const { data: tableCheck } = await supabase
        .from('support_chat_messages')
        .select('id')
        .limit(1)
        .maybeSingle()
      
      // If table doesn't exist, return empty
      if (tableCheck === null) {
        console.log('Support chat table not found, using mock data')
        setMessages([])
        return
      }

      const { data } = await supabase
        .from('support_chat_messages')
        .select(`
          *,
          user:user_id (
            id,
            username,
            display_name,
            avatar_url,
            is_admin
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })
        .limit(50)
      
      if (data) setMessages(data)
    } catch (error) {
      console.error('Error loading chat messages:', error)
      // Silently fail, show empty state
    }
  }

  async function checkAdminStatus() {
    try {
      // Check if any admin exists (fallback method without last_seen)
      const { data } = await supabase
        .from('profiles')
        .select('id, updated_at')
        .eq('is_admin', true)
        .limit(1)
      
      // Check if admin was active in last 5 minutes using updated_at
      if (data && data.length > 0) {
        const lastActive = new Date(data[0].updated_at)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        setIsAdminOnline(lastActive > fiveMinutesAgo)
      } else {
        setIsAdminOnline(false)
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      setIsAdminOnline(false)
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return
    
    setChatLoading(true)
    try {
      // Insert message
      const { data, error } = await supabase
        .from('support_chat_messages')
        .insert({
          user_id: session.user.id,
          message: newMessage,
          is_admin: false
        })
        .select(`
          *,
          user:user_id (
            id,
            username,
            display_name,
            avatar_url,
            is_admin
          )
        `)
        .single()

      if (error) throw error

      setMessages(prev => [...prev, data])
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    }
    setChatLoading(false)
  }

  function handleRating(star) {
    setFeedback({ ...feedback, rating: star })
  }

  async function submitFeedback() {
    if (feedback.rating === 0) {
      alert('Please select a rating')
      return
    }
    
    try {
      await supabase
        .from('support_feedback')
        .insert({
          user_id: session.user.id,
          rating: feedback.rating,
          comment: feedback.comment,
          created_at: new Date().toISOString()
        })
      
      alert('Thank you for your feedback! 🙏')
      setShowFeedback(false)
      setFeedback({ rating: 0, comment: '' })
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Failed to submit feedback. Please try again.')
    }
  }

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(f => f.category === activeCategory)

  const styles = {
    container: {
      maxWidth: '900px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    subtitle: {
      color: '#6b7280',
      marginBottom: '24px',
      fontWeight: '700'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: '16px'
    },
    categories: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginBottom: '20px'
    },
    categoryBtn: {
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer',
      border: '1px solid #e5e7eb',
      background: 'transparent',
      color: '#6b7280',
      transition: 'all 0.2s'
    },
    categoryBtnActive: {
      background: '#7c3aed',
      color: 'white',
      borderColor: '#7c3aed'
    },
    faqQuestion: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '12px 0',
      fontWeight: '700',
      fontSize: '16px'
    },
    faqAnswer: {
      padding: '12px 0 16px 0',
      color: '#6b7280',
      borderTop: '1px solid #f3f4f6',
      lineHeight: '1.6',
      fontWeight: '700'
    },
    faqCategory: {
      fontSize: '11px',
      color: '#7c3aed',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    chatContainer: {
      display: 'flex',
      flexDirection: 'column',
      height: '400px',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      overflow: 'hidden'
    },
    chatHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      background: '#f9fafb',
      borderBottom: '1px solid #e5e7eb'
    },
    chatHeaderLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    chatStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      fontWeight: '700'
    },
    chatStatusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      display: 'inline-block'
    },
    chatStatusOnline: {
      background: '#10b981'
    },
    chatStatusOffline: {
      background: '#ef4444'
    },
    chatMessages: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      background: '#fafafa'
    },
    chatMessage: {
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px'
    },
    chatMessageUser: {
      justifyContent: 'flex-end'
    },
    chatMessageAdmin: {
      justifyContent: 'flex-start'
    },
    chatBubble: {
      maxWidth: '70%',
      padding: '10px 14px',
      borderRadius: '16px',
      wordBreak: 'break-word'
    },
    chatBubbleUser: {
      background: '#7c3aed',
      color: 'white',
      borderBottomRightRadius: '4px'
    },
    chatBubbleAdmin: {
      background: 'white',
      color: '#1f2937',
      borderBottomLeftRadius: '4px',
      border: '1px solid #e5e7eb'
    },
    chatTime: {
      fontSize: '10px',
      color: '#6b7280',
      marginTop: '4px',
      fontWeight: '700'
    },
    chatTimeUser: {
      textAlign: 'right',
      color: 'rgba(255,255,255,0.6)'
    },
    chatAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      objectFit: 'cover',
      flexShrink: 0
    },
    chatInput: {
      display: 'flex',
      gap: '8px',
      padding: '12px 16px',
      borderTop: '1px solid #e5e7eb',
      background: 'white'
    },
    chatInputField: {
      flex: 1,
      padding: '10px 16px',
      border: '1px solid #ddd',
      borderRadius: '20px',
      outline: 'none',
      fontSize: '14px',
      fontWeight: '700'
    },
    chatSendBtn: {
      padding: '10px 20px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    chatToggle: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s',
      marginTop: '16px',
      width: '100%'
    },
    chatClose: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#6b7280'
    },
    feedbackSection: {
      marginTop: '16px',
      padding: '16px',
      background: '#f9fafb',
      borderRadius: '12px',
      textAlign: 'center'
    },
    feedbackStars: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
      marginTop: '12px'
    },
    feedbackStar: {
      fontSize: '32px',
      cursor: 'pointer',
      transition: 'transform 0.2s'
    },
    feedbackStarActive: {
      color: '#f59e0b',
      transform: 'scale(1.1)'
    },
    feedbackStarInactive: {
      color: '#d1d5db'
    },
    feedbackTextarea: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit',
      marginTop: '12px'
    },
    feedbackSubmit: {
      padding: '10px 24px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s',
      marginTop: '12px'
    },
    contactBtn: {
      padding: '12px 24px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s',
      marginTop: '16px'
    },
    emptyState: {
      textAlign: 'center',
      padding: '20px',
      color: '#6b7280',
      fontWeight: '700'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>❓ Help & Support</h1>
      <p style={styles.subtitle}>Find answers to common questions or chat with our support team</p>

      {/* Feedback Section */}
      {!showFeedback && (
        <div style={styles.card}>
          <div style={styles.feedbackSection}>
            <h4 style={{ fontWeight: '700', marginBottom: '4px' }}>💬 How was your experience?</h4>
            <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700' }}>
              Help us improve by rating your experience
            </p>
            <button 
              style={styles.chatToggle}
              onClick={() => setShowFeedback(true)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ⭐ Leave Feedback
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontWeight: '700' }}>⭐ Rate Your Experience</h3>
            <button style={styles.chatClose} onClick={() => setShowFeedback(false)}>×</button>
          </div>
          <div style={styles.feedbackStars}>
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                style={{
                  ...styles.feedbackStar,
                  ...(feedback.rating >= star ? styles.feedbackStarActive : styles.feedbackStarInactive)
                }}
                onClick={() => handleRating(star)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                ★
              </span>
            ))}
          </div>
          <textarea
            style={styles.feedbackTextarea}
            placeholder="Tell us what we can improve..."
            value={feedback.comment}
            onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
          />
          <button 
            style={styles.feedbackSubmit}
            onClick={submitFeedback}
            onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
          >
            Submit Feedback
          </button>
        </div>
      )}

      {/* FAQ Section */}
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: '700' }}>📚 Frequently Asked Questions</h3>
          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '700' }}>{filteredFaqs.length} topics</span>
        </div>

        <div style={styles.categories}>
          {categories.map(cat => (
            <button
              key={cat.id}
              style={{
                ...styles.categoryBtn,
                ...(activeCategory === cat.id ? styles.categoryBtnActive : {})
              }}
              onClick={() => setActiveCategory(cat.id)}
              onMouseEnter={(e) => {
                if (activeCategory !== cat.id) {
                  e.currentTarget.style.background = '#f3f4f6'
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat.id) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filteredFaqs.map((faq, index) => (
          <div key={faq.id}>
            <div
              style={styles.faqQuestion}
              onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
            >
              <div>
                <div style={styles.faqCategory}>{faq.category.replace('-', ' ')}</div>
                <span style={{ fontSize: '15px', fontWeight: '700' }}>{faq.question}</span>
              </div>
              <span style={{ fontSize: '20px', flexShrink: 0, fontWeight: '700' }}>
                {activeFaq === faq.id ? '−' : '+'}
              </span>
            </div>
            {activeFaq === faq.id && (
              <div style={styles.faqAnswer}>
                {faq.answer}
              </div>
            )}
            {index < filteredFaqs.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6' }} />}
          </div>
        ))}
      </div>

      {/* Live Chat Section */}
      {!showChat ? (
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '32px' }}>💬</span>
            <div>
              <h3 style={{ fontWeight: '700' }}>Chat with Support</h3>
              <p style={{ color: '#6b7280', fontSize: '13px', fontWeight: '700' }}>
                {isAdminOnline ? '🟢 Admin is online' : '🟡 Leave a message'}
              </p>
            </div>
          </div>
          <button
            style={styles.chatToggle}
            onClick={() => setShowChat(true)}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isAdminOnline ? '💬 Start Chat' : '📩 Send Message'}
          </button>
        </div>
      ) : (
        <div style={styles.card}>
          <div style={styles.chatContainer}>
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderLeft}>
                <span style={{ fontSize: '20px' }}>💬</span>
                <div>
                  <strong style={{ fontWeight: '700' }}>Support Chat</strong>
                  <div style={styles.chatStatus}>
                    <span style={{
                      ...styles.chatStatusDot,
                      ...(isAdminOnline ? styles.chatStatusOnline : styles.chatStatusOffline)
                    }}></span>
                    {isAdminOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
              <button style={styles.chatClose} onClick={() => setShowChat(false)}>×</button>
            </div>

            <div style={styles.chatMessages}>
              {messages.length === 0 ? (
                <div style={styles.emptyState}>
                  <p>No messages yet. Start the conversation!</p>
                  <p style={{ fontSize: '12px', marginTop: '8px', fontWeight: '700' }}>
                    {isAdminOnline ? 'An admin is online and will respond shortly.' : 'An admin will respond when they come online.'}
                  </p>
                </div>
              ) : (
                messages.map(msg => {
                  const isUser = msg.user_id === session.user.id
                  return (
                    <div key={msg.id} style={{
                      ...styles.chatMessage,
                      ...(isUser ? styles.chatMessageUser : styles.chatMessageAdmin)
                    }}>
                      {!isUser && msg.user?.avatar_url && (
                        <img src={msg.user.avatar_url} style={styles.chatAvatar} alt="admin" />
                      )}
                      <div>
                        <div style={{
                          ...styles.chatBubble,
                          ...(isUser ? styles.chatBubbleUser : styles.chatBubbleAdmin)
                        }}>
                          {!isUser && msg.user?.is_admin && (
                            <span style={{ color: '#7c3aed', fontWeight: '700', display: 'block', fontSize: '11px' }}>
                              👑 Admin
                            </span>
                          )}
                          {msg.message}
                        </div>
                        <div style={{
                          ...styles.chatTime,
                          ...(isUser ? styles.chatTimeUser : {})
                        }}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      {isUser && msg.user?.avatar_url && (
                        <img src={msg.user.avatar_url} style={styles.chatAvatar} alt="user" />
                      )}
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.chatInput}>
              <input
                style={styles.chatInputField}
                placeholder={isAdminOnline ? "Type your message..." : "Leave a message..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                style={styles.chatSendBtn}
                onClick={sendMessage}
                disabled={chatLoading}
                onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
              >
                {chatLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{...styles.card, textAlign: 'center'}}>
        <h3 style={{ marginBottom: '8px', fontWeight: '700' }}>Still need help?</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px', fontWeight: '700' }}>
          Contact our support team and we'll get back to you within 24 hours.
        </p>
        <button
          style={styles.contactBtn}
          onClick={() => window.location.href = 'mailto:support@socialvibe.com'}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
        >
          📧 Contact Support
        </button>
      </div>
    </div>
  )
}