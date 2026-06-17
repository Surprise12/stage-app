// src/components/VirtualConcert.jsx - UPDATED WITH INLINE STYLES
import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function VirtualConcert({ session }) {
  const [concerts, setConcerts] = useState([])
  const [myConcerts, setMyConcerts] = useState([])
  const [selectedConcert, setSelectedConcert] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    ticket_price: '',
    ticket_tiers: [
      { name: 'General Admission', price: 10, perks: ['🎟️ Access to stream', '💬 Live chat access'] },
      { name: 'VIP', price: 25, perks: ['🎟️ Access to stream', '💬 Live chat access', '📥 Digital download', '🎨 Exclusive chat'] },
      { name: 'Meet & Greet', price: 50, perks: ['🎟️ Access to stream', '💬 Live chat access', '📥 Digital download', '🎨 Exclusive chat', '📹 5-min video call', '📸 Signed digital poster'] }
    ]
  })
  const [chatMessages, setChatMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [reactions, setReactions] = useState({ like: 0, heart: 0, fire: 0, clap: 0 })
  const [isStreaming, setIsStreaming] = useState(false)
  const [viewerCount, setViewerCount] = useState(0)
  const [isPurchased, setIsPurchased] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    loadConcerts()
    loadMyConcerts()
  }, [])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  async function loadConcerts() {
    try {
      const { data } = await supabase
        .from('virtual_concerts')
        .select('*, profiles:creator_id(id, username, display_name, avatar_url, is_verified)')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
      if (data) setConcerts(data)
    } catch (error) {
      console.error('Error loading concerts:', error)
    }
  }

  async function loadMyConcerts() {
    try {
      const { data } = await supabase
        .from('virtual_concerts')
        .select('*')
        .eq('creator_id', session.user.id)
        .order('created_at', { ascending: false })
      if (data) setMyConcerts(data)
    } catch (error) {
      console.error('Error loading my concerts:', error)
    }
  }

  async function createConcert() {
    if (!formData.title || !formData.date) {
      alert('Please fill in required fields')
      return
    }

    try {
      const { error } = await supabase
        .from('virtual_concerts')
        .insert({
          creator_id: session.user.id,
          title: formData.title,
          description: formData.description,
          date: formData.date,
          ticket_price: parseFloat(formData.ticket_price) || 0,
          ticket_tiers: formData.ticket_tiers,
          stream_url: `https://stream.socialvibe.com/${Date.now()}`,
          stream_key: Math.random().toString(36).substring(7).toUpperCase()
        })

      if (error) throw error

      alert('🎉 Virtual concert created!')
      setShowCreateForm(false)
      setFormData({
        title: '', description: '', date: '', ticket_price: '', ticket_tiers: [
          { name: 'General Admission', price: 10, perks: ['🎟️ Access to stream', '💬 Live chat access'] },
          { name: 'VIP', price: 25, perks: ['🎟️ Access to stream', '💬 Live chat access', '📥 Digital download', '🎨 Exclusive chat'] },
          { name: 'Meet & Greet', price: 50, perks: ['🎟️ Access to stream', '💬 Live chat access', '📥 Digital download', '🎨 Exclusive chat', '📹 5-min video call', '📸 Signed digital poster'] }
        ]
      })
      loadConcerts()
      loadMyConcerts()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function purchaseTicket(concertId, tier) {
    try {
      const { error } = await supabase
        .from('concert_tickets')
        .insert({
          concert_id: concertId,
          buyer_id: session.user.id,
          tier: tier.name,
          amount_paid: tier.price
        })

      if (error) throw error

      alert(`🎫 Ticket purchased! You now have access to ${tier.name} perks.`)
      setShowTicketModal(false)
      setIsPurchased(true)
      loadConcerts()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  async function joinConcert(concert) {
    try {
      if (concert.ticket_price > 0) {
        const { data: hasTicket } = await supabase
          .from('concert_tickets')
          .select('id')
          .eq('concert_id', concert.id)
          .eq('buyer_id', session.user.id)
          .single()
        
        if (!hasTicket) {
          setSelectedConcert(concert)
          setShowTicketModal(true)
          return
        }
      }
      
      setSelectedConcert(concert)
      setIsPurchased(true)
      setIsStreaming(true)
      setViewerCount(prev => prev + 1)
      
      const { data } = await supabase
        .from('concert_chat')
        .select('*, profiles:user_id(id, username, display_name, avatar_url)')
        .eq('concert_id', concert.id)
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setChatMessages(data)
      
      const subscription = supabase
        .channel('concert_chat')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'concert_chat',
          filter: `concert_id=eq.${concert.id}`
        }, (payload) => {
          setChatMessages(prev => [...prev, payload.new])
        })
        .subscribe()
      
      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Error joining concert:', error)
    }
  }

  async function sendChatMessage() {
    if (!newMessage.trim()) return

    try {
      const { error } = await supabase
        .from('concert_chat')
        .insert({
          concert_id: selectedConcert.id,
          user_id: session.user.id,
          message: newMessage
        })

      if (!error) {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  async function sendReaction(type) {
    setReactions(prev => ({ ...prev, [type]: prev[type] + 1 }))
    try {
      await supabase
        .from('concert_reactions')
        .insert({
          concert_id: selectedConcert.id,
          user_id: session.user.id,
          reaction_type: type
        })
    } catch (error) {
      console.error('Error sending reaction:', error)
    }
  }

  async function sendTip() {
    const amount = prompt('Enter tip amount ($):', '5')
    if (!amount) return
    
    const tipAmount = parseFloat(amount)
    if (isNaN(tipAmount) || tipAmount <= 0) return
    
    try {
      await supabase
        .from('concert_chat')
        .insert({
          concert_id: selectedConcert.id,
          user_id: session.user.id,
          message: `🎉 Sent $${tipAmount} tip! 🎉`,
          is_tip: true,
          tip_amount: tipAmount
        })
      
      await supabase
        .from('tips')
        .insert({
          sender_id: session.user.id,
          recipient_id: selectedConcert.creator_id,
          amount: tipAmount,
          message: `Virtual concert tip for "${selectedConcert.title}"`
        })
      
      alert(`💸 Thanks for the $${tipAmount} tip!`)
    } catch (error) {
      console.error('Error sending tip:', error)
    }
  }

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function formatTimeAgo(date) {
    if (!date) return 'just now'
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(date).toLocaleDateString()
  }

  const filteredConcerts = concerts.filter(concert =>
    concert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    concert.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const reactionTypes = [
    { type: 'like', emoji: '❤️', label: 'Love' },
    { type: 'heart', emoji: '💖', label: 'Heart' },
    { type: 'fire', emoji: '🔥', label: 'Fire' },
    { type: 'clap', emoji: '👏', label: 'Clap' }
  ]

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '30px auto 0',
      padding: '0 20px'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '16px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700'
    },
    headerActions: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      background: 'white',
      borderRadius: '40px',
      padding: '8px 16px',
      gap: '8px',
      width: '250px',
      border: '1px solid #ddd',
      transition: 'all 0.3s'
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
    primaryBtn: {
      padding: '10px 20px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    tabs: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      borderBottom: '1px solid #ddd',
      paddingBottom: '0'
    },
    tab: {
      padding: '10px 20px',
      fontWeight: '700',
      color: '#6b7280',
      cursor: 'pointer',
      position: 'relative',
      transition: 'all 0.2s',
      fontSize: '14px'
    },
    tabActive: {
      color: '#000'
    },
    tabIndicator: {
      position: 'absolute',
      bottom: '-1px',
      left: 0,
      right: 0,
      height: '2px',
      background: '#7c3aed'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb'
    },
    formContainer: {
      display: 'grid',
      gap: '16px'
    },
    formInput: {
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      transition: 'all 0.2s',
      background: 'white'
    },
    formTextarea: {
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      minHeight: '80px',
      resize: 'vertical',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
      background: 'white'
    },
    grid2: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px'
    },
    concertCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'all 0.2s'
    },
    concertHeader: {
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      padding: '20px',
      borderRadius: '16px',
      textAlign: 'center',
      marginBottom: '16px',
      position: 'relative'
    },
    concertIcon: {
      fontSize: '48px'
    },
    concertTitle: {
      fontWeight: '700',
      fontSize: '18px',
      marginTop: '8px',
      color: 'white'
    },
    concertPrice: {
      fontSize: '12px',
      color: 'rgba(255,255,255,0.8)',
      marginTop: '4px'
    },
    verifiedBadge: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      fontSize: '12px',
      color: '#1da1f2'
    },
    concertDesc: {
      color: '#6b7280',
      fontWeight: '700'
    },
    concertCreator: {
      marginTop: '12px',
      fontWeight: '700'
    },
    concertDate: {
      fontWeight: '700',
      marginTop: '4px'
    },
    tierSection: {
      marginTop: '16px'
    },
    tierTitle: {
      fontWeight: '700'
    },
    tierItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
      padding: '12px',
      background: '#f5f5f5',
      borderRadius: '8px'
    },
    tierName: {
      fontWeight: '700'
    },
    tierPerks: {
      marginLeft: '16px',
      fontSize: '11px',
      marginTop: '4px',
      listStyle: 'none',
      paddingLeft: '0'
    },
    tierPerkItem: {
      color: '#666',
      fontWeight: '700'
    },
    tierMorePerks: {
      color: '#999',
      fontSize: '10px',
      fontWeight: '700'
    },
    tierPriceBtn: {
      padding: '6px 16px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    joinBtn: {
      width: '100%',
      padding: '12px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      marginTop: '16px',
      transition: 'all 0.2s'
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: '#888'
    },
    emptyIcon: {
      fontSize: '48px',
      color: '#ccc',
      marginBottom: '16px'
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    },
    modalContent: {
      background: 'white',
      borderRadius: '24px',
      padding: '24px',
      maxWidth: '450px',
      width: '90%',
      maxHeight: '90vh',
      overflowY: 'auto'
    },
    modalLarge: {
      maxWidth: '900px',
      width: '95%'
    },
    modalTitle: {
      fontSize: '20px',
      fontWeight: '700',
      marginBottom: '20px'
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#666'
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px'
    },
    ticketInfo: {
      textAlign: 'center',
      marginBottom: '20px'
    },
    ticketIcon: {
      fontSize: '48px',
      marginBottom: '8px'
    },
    ticketConcertTitle: {
      fontWeight: '700',
      fontSize: '20px'
    },
    ticketCreator: {
      color: '#888',
      fontWeight: '700'
    },
    ticketTierBox: {
      background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,73,153,0.1))',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '20px'
    },
    ticketTierRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    ticketTierPrice: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#7c3aed'
    },
    ticketPerks: {
      marginTop: '8px',
      paddingLeft: '20px'
    },
    ticketPerkItem: {
      fontSize: '13px',
      marginBottom: '4px',
      fontWeight: '700'
    },
    confirmBtn: {
      width: '100%',
      padding: '14px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s'
    },
    cancelBtn: {
      width: '100%',
      padding: '14px',
      background: 'transparent',
      color: '#666',
      border: '1px solid #ddd',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      marginTop: '8px',
      transition: 'all 0.2s'
    },
    playerContainer: {
      background: '#000',
      borderRadius: '16px',
      overflow: 'hidden',
      marginBottom: '16px'
    },
    videoPlayer: {
      width: '100%',
      maxHeight: '400px',
      background: '#000'
    },
    playerControls: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      marginBottom: '16px'
    },
    reactionButtons: {
      display: 'flex',
      gap: '12px'
    },
    reactionBtn: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px 12px',
      borderRadius: '20px',
      color: '#aaa',
      transition: 'all 0.2s',
      fontWeight: '700'
    },
    playerRight: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    viewerCount: {
      color: '#888',
      fontSize: '13px',
      display: 'flex',
      alignItems: 'center'
    },
    chatContainer: {
      border: '1px solid #2a2a2a',
      borderRadius: '12px',
      height: '300px',
      display: 'flex',
      flexDirection: 'column'
    },
    chatMessages: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      background: '#0a0a0a'
    },
    chatMessage: {
      marginBottom: '12px'
    },
    chatUser: {
      color: '#fff',
      fontWeight: '700'
    },
    chatText: {
      color: '#ccc',
      marginLeft: '8px'
    },
    chatTip: {
      color: '#ffc371',
      marginLeft: '8px'
    },
    chatTime: {
      fontSize: '10px',
      color: '#666',
      marginTop: '2px'
    },
    chatInputArea: {
      padding: '12px',
      borderTop: '1px solid #2a2a2a',
      display: 'flex',
      gap: '8px',
      background: '#1a1a1a'
    },
    chatInput: {
      flex: 1,
      padding: '10px 16px',
      border: '1px solid #333',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      background: '#0a0a0a',
      color: 'white'
    },
    chatSendBtn: {
      padding: '10px 20px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      transition: 'all 0.2s'
    },
    myConcertCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    },
    myConcertHeader: {
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      padding: '16px',
      borderRadius: '12px',
      marginBottom: '12px'
    },
    myConcertIcon: {
      fontSize: '32px'
    },
    myConcertTitle: {
      marginTop: '8px',
      fontWeight: '700',
      color: 'white'
    },
    myConcertDetails: {
      fontWeight: '700'
    },
    myConcertAttendees: {
      fontWeight: '700'
    },
    manageBtn: {
      width: '100%',
      padding: '10px',
      background: 'transparent',
      color: '#6b7280',
      border: '1px solid #ddd',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: '700',
      marginTop: '12px',
      transition: 'all 0.2s'
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🎤 Virtual Concerts</h1>
        <div style={styles.headerActions}>
          <div style={styles.searchBox}>
            <i className="fas fa-search" style={{ color: '#666' }}></i>
            <input 
              type="text" 
              style={styles.searchInput}
              placeholder="Search concerts..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            style={styles.primaryBtn}
            onClick={() => setShowCreateForm(!showCreateForm)}
            onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
          >
            <i className="fas fa-plus"></i> Create Concert
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <div 
          style={{...styles.tab, ...(activeTab === 'upcoming' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Concerts
          {activeTab === 'upcoming' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'my-concerts' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('my-concerts')}
        >
          My Concerts ({myConcerts.length})
          {activeTab === 'my-concerts' && <div style={styles.tabIndicator}></div>}
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'past' ? styles.tabActive : {})}}
          onClick={() => setActiveTab('past')}
        >
          Past Concerts
          {activeTab === 'past' && <div style={styles.tabIndicator}></div>}
        </div>
      </div>

      {/* Create Concert Form */}
      {showCreateForm && (
        <div style={styles.card}>
          <h3 style={{ marginBottom: '16px', fontWeight: '700' }}>Create Virtual Concert</h3>
          <div style={styles.formContainer}>
            <input 
              type="text" 
              style={styles.formInput}
              placeholder="Concert Title *" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
            />
            <textarea 
              style={styles.formTextarea}
              placeholder="Description" 
              rows="3" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
            />
            <input 
              type="datetime-local" 
              style={styles.formInput}
              value={formData.date} 
              onChange={(e) => setFormData({...formData, date: e.target.value})} 
            />
            <input 
              type="number" 
              style={styles.formInput}
              placeholder="Base Ticket Price ($)" 
              step="0.01" 
              value={formData.ticket_price} 
              onChange={(e) => setFormData({...formData, ticket_price: e.target.value})} 
            />
            <button 
              style={styles.primaryBtn}
              onClick={createConcert}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              <i className="fas fa-music"></i> Create Concert
            </button>
            <button 
              style={styles.cancelBtn}
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* My Concerts Tab */}
      {activeTab === 'my-concerts' && (
        <>
          {myConcerts.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-music" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>You haven't created any concerts yet.</p>
                <button 
                  style={styles.primaryBtn}
                  onClick={() => setShowCreateForm(true)}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                >
                  Create Your First Concert
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.grid2}>
              {myConcerts.map(concert => (
                <div key={concert.id} style={styles.myConcertCard}>
                  <div style={styles.myConcertHeader}>
                    <div style={styles.myConcertIcon}>🎵</div>
                    <h4 style={styles.myConcertTitle}>{concert.title}</h4>
                  </div>
                  <p style={styles.myConcertDetails}>📅 {new Date(concert.date).toLocaleString()}</p>
                  <p style={styles.myConcertDetails}>🎟️ {concert.ticket_price > 0 ? `$${concert.ticket_price}` : 'Free'}</p>
                  <p style={styles.myConcertAttendees}>👁️ {concert.attendee_count || 0} attendees</p>
                  <button style={styles.manageBtn}>
                    <i className="fas fa-edit"></i> Manage
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Upcoming Concerts Tab */}
      {activeTab === 'upcoming' && (
        <>
          {filteredConcerts.length === 0 ? (
            <div style={styles.card}>
              <div style={styles.emptyState}>
                <i className="fas fa-calendar-times" style={styles.emptyIcon}></i>
                <p style={{ color: '#888' }}>No upcoming concerts found</p>
              </div>
            </div>
          ) : (
            <div style={styles.grid2}>
              {filteredConcerts.map(concert => (
                <div key={concert.id} style={styles.concertCard}>
                  <div style={styles.concertHeader}>
                    <div style={styles.concertIcon}>🎵</div>
                    <div style={styles.concertTitle}>{concert.title}</div>
                    {concert.profiles?.is_verified && (
                      <span style={styles.verifiedBadge}>✓ Verified</span>
                    )}
                    <div style={styles.concertPrice}>
                      {concert.ticket_price > 0 ? `🎟️ $${concert.ticket_price}` : '🎟️ Free'}
                    </div>
                  </div>
                  
                  <p style={styles.concertDesc}>{concert.description}</p>
                  <p style={styles.concertCreator}>
                    🎤 by {concert.profiles?.display_name || concert.profiles?.username}
                  </p>
                  <p style={styles.concertDate}>📅 {formatDate(concert.date)}</p>
                  
                  <div style={styles.tierSection}>
                    <strong style={styles.tierTitle}>Ticket Tiers:</strong>
                    {concert.ticket_tiers?.map((tier, i) => (
                      <div key={i} style={styles.tierItem}>
                        <div>
                          <strong style={styles.tierName}>{tier.name}</strong>
                          <ul style={styles.tierPerks}>
                            {tier.perks?.slice(0, 2).map((perk, j) => (
                              <li key={j} style={styles.tierPerkItem}>✓ {perk}</li>
                            ))}
                            {tier.perks?.length > 2 && (
                              <li style={styles.tierMorePerks}>+{tier.perks.length - 2} more</li>
                            )}
                          </ul>
                        </div>
                        <button 
                          style={styles.tierPriceBtn}
                          onClick={() => {
                            setSelectedConcert(concert)
                            setSelectedTier(tier)
                            setShowTicketModal(true)
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                        >
                          ${tier.price}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    style={styles.joinBtn}
                    onClick={() => joinConcert(concert)}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                  >
                    <i className="fas fa-ticket-alt"></i> Join Concert
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Ticket Purchase Modal */}
      {showTicketModal && selectedConcert && selectedTier && (
        <div style={styles.modal} onClick={() => setShowTicketModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>🎫 Purchase Ticket</div>
            
            <div style={styles.ticketInfo}>
              <div style={styles.ticketIcon}>🎵</div>
              <h3 style={styles.ticketConcertTitle}>{selectedConcert.title}</h3>
              <p style={styles.ticketCreator}>by {selectedConcert.profiles?.display_name || selectedConcert.profiles?.username}</p>
            </div>
            
            <div style={styles.ticketTierBox}>
              <div style={styles.ticketTierRow}>
                <span style={styles.tierName}>{selectedTier.name}</span>
                <span style={styles.ticketTierPrice}>${selectedTier.price}</span>
              </div>
              <ul style={styles.ticketPerks}>
                {selectedTier.perks.map((perk, i) => (
                  <li key={i} style={styles.ticketPerkItem}>✓ {perk}</li>
                ))}
              </ul>
            </div>
            
            <button 
              style={styles.confirmBtn}
              onClick={() => purchaseTicket(selectedConcert.id, selectedTier)}
              onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
            >
              Purchase - ${selectedTier.price}
            </button>
            <button 
              style={styles.cancelBtn}
              onClick={() => setShowTicketModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Concert Player Modal */}
      {selectedConcert && isPurchased && (
        <div style={styles.modal} onClick={() => setSelectedConcert(null)}>
          <div style={{...styles.modalContent, ...styles.modalLarge}} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontWeight: '700' }}>{selectedConcert.title}</h2>
              <button style={styles.modalClose} onClick={() => setSelectedConcert(null)}>×</button>
            </div>
            
            <div style={styles.playerContainer}>
              <video 
                controls 
                autoPlay 
                style={styles.videoPlayer} 
                src={selectedConcert.stream_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'} 
              />
            </div>
            
            <div style={styles.playerControls}>
              <div style={styles.reactionButtons}>
                {reactionTypes.map(rt => (
                  <button 
                    key={rt.type} 
                    style={styles.reactionBtn}
                    onClick={() => sendReaction(rt.type)}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderRadius = '20px'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    {rt.emoji} {reactions[rt.type] || 0}
                  </button>
                ))}
              </div>
              <div style={styles.playerRight}>
                <button 
                  style={styles.primaryBtn}
                  onClick={sendTip}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                >
                  💸 Send Tip
                </button>
                <span style={styles.viewerCount}>
                  👁️ {viewerCount} watching
                </span>
              </div>
            </div>
            
            <div style={styles.chatContainer}>
              <div style={styles.chatMessages}>
                {chatMessages.map((msg, index) => (
                  <div key={msg.id || index} style={styles.chatMessage}>
                    <strong style={styles.chatUser}>{msg.profiles?.display_name || msg.profiles?.username || 'Anonymous'}:</strong>
                    <span style={styles.chatText}>{msg.message}</span>
                    {msg.is_tip && <span style={styles.chatTip}>💸 ${msg.tip_amount}</span>}
                    <div style={styles.chatTime}>{formatTimeAgo(msg.created_at)}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={styles.chatInputArea}>
                <input 
                  type="text" 
                  style={styles.chatInput}
                  placeholder="Chat with other fans..." 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                />
                <button 
                  style={styles.chatSendBtn}
                  onClick={sendChatMessage}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}