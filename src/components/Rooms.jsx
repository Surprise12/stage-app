// src/components/Rooms.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Rooms({ session }) {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [activeRoom, setActiveRoom] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [newRoom, setNewRoom] = useState({ name: '', topic: '', type: 'audio' })

  useEffect(() => {
    loadRooms()
  }, [])

  async function loadRooms() {
    setLoading(true)
    try {
      // In production, fetch from rooms table
      const mockRooms = [
        { id: 1, name: 'Music Producers Lounge', topic: 'Beat making tips', type: 'audio', speakers: ['user1', 'user2'], listeners: 45, is_active: true },
        { id: 2, name: 'Live Performance Discussion', topic: 'Stage presence tips', type: 'video', speakers: ['user3'], listeners: 23, is_active: true },
        { id: 3, name: 'Collab Finder', topic: 'Find your next collaborator', type: 'audio', speakers: ['user4', 'user5', 'user6'], listeners: 67, is_active: true },
      ]
      setRooms(mockRooms)
    } catch (error) {
      console.error('Error loading rooms:', error)
    }
    setLoading(false)
  }

  async function createRoom() {
    if (!newRoom.name || !newRoom.topic) return
    // In production, save to database
    const room = {
      id: Date.now(),
      name: newRoom.name,
      topic: newRoom.topic,
      type: newRoom.type,
      speakers: [session.user.email],
      listeners: 0,
      is_active: true,
      created_at: new Date()
    }
    setRooms(prev => [room, ...prev])
    setNewRoom({ name: '', topic: '', type: 'audio' })
    setShowCreateRoom(false)
  }

  function joinRoom(room) {
    setActiveRoom(room)
  }

  function leaveRoom() {
    setActiveRoom(null)
  }

  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#1f2937'
    },
    createBtn: {
      padding: '12px 24px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '14px',
      transition: 'all 0.2s'
    },
    roomCard: {
      background: 'white',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: '1px solid #e5e7eb',
      animation: 'fadeIn 0.3s ease'
    },
    roomHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start'
    },
    roomName: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937'
    },
    roomTopic: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700',
      marginTop: '4px'
    },
    roomBadge: {
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '700',
      background: '#f0fdf4',
      color: '#10b981'
    },
    roomStats: {
      display: 'flex',
      gap: '16px',
      marginTop: '12px',
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700'
    },
    roomSpeakers: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px',
      flexWrap: 'wrap'
    },
    speakerAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '12px'
    },
    joinBtn: {
      padding: '8px 20px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '20px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '12px',
      transition: 'all 0.2s'
    },
    activeRoomContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column'
    },
    activeRoomContent: {
      background: 'white',
      borderRadius: '24px',
      padding: '40px',
      maxWidth: '500px',
      width: '90%',
      textAlign: 'center'
    },
    activeRoomTitle: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '8px'
    },
    activeRoomTopic: {
      fontSize: '16px',
      color: '#6b7280',
      fontWeight: '700',
      marginBottom: '24px'
    },
    speakerGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      justifyContent: 'center',
      marginBottom: '24px'
    },
    speakerCard: {
      width: '80px',
      textAlign: 'center'
    },
    speakerCardAvatar: {
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: '700',
      fontSize: '24px',
      margin: '0 auto 8px'
    },
    speakerCardName: {
      fontSize: '12px',
      fontWeight: '700'
    },
    leaveBtn: {
      padding: '12px 32px',
      background: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px'
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
      padding: '32px',
      maxWidth: '500px',
      width: '90%'
    },
    modalTitle: {
      fontSize: '24px',
      fontWeight: '700',
      marginBottom: '20px'
    },
    formInput: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none'
    },
    formSelect: {
      width: '100%',
      padding: '12px 16px',
      border: '1px solid #ddd',
      borderRadius: '12px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: '700',
      outline: 'none',
      background: 'white'
    },
    formBtn: {
      width: '100%',
      padding: '14px',
      background: '#000',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px'
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
      marginTop: '8px'
    }
  }

  if (loading) {
    return <div className="spinner" style={{ marginTop: '40px' }}></div>
  }

  // Active Room View
  if (activeRoom) {
    return (
      <div style={styles.activeRoomContainer} onClick={leaveRoom}>
        <div style={styles.activeRoomContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.activeRoomTitle}>🎙️ {activeRoom.name}</div>
          <div style={styles.activeRoomTopic}>{activeRoom.topic}</div>
          
          <div style={styles.speakerGrid}>
            {activeRoom.speakers.map((speaker, index) => (
              <div key={index} style={styles.speakerCard}>
                <div style={styles.speakerCardAvatar}>
                  {speaker[0]?.toUpperCase() || 'U'}
                </div>
                <div style={styles.speakerCardName}>{speaker}</div>
              </div>
            ))}
          </div>
          
          <div style={{ marginBottom: '16px', color: '#6b7280', fontWeight: '700' }}>
            👂 {activeRoom.listeners} listening
          </div>
          
          <button style={styles.leaveBtn} onClick={leaveRoom}>
            Leave Room
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>🎙️ Rooms</div>
        <button 
          style={styles.createBtn}
          onClick={() => setShowCreateRoom(true)}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
        >
          <i className="fas fa-plus"></i> Create Room
        </button>
      </div>

      {rooms.map(room => (
        <div 
          key={room.id} 
          style={styles.roomCard}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(4px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <div style={styles.roomHeader}>
            <div>
              <div style={styles.roomName}>{room.name}</div>
              <div style={styles.roomTopic}>{room.topic}</div>
            </div>
            <span style={styles.roomBadge}>{room.type === 'audio' ? '🎧 Audio' : '📹 Video'}</span>
          </div>
          
          <div style={styles.roomStats}>
            <span>👤 {room.speakers.length} speakers</span>
            <span>👂 {room.listeners} listeners</span>
            <span>{room.is_active ? '🟢 Active' : '🔴 Inactive'}</span>
          </div>
          
          <div style={styles.roomSpeakers}>
            {room.speakers.map((speaker, index) => (
              <div key={index} style={styles.speakerAvatar}>
                {speaker[0]?.toUpperCase() || 'U'}
              </div>
            ))}
          </div>
          
          <button 
            style={styles.joinBtn}
            onClick={() => joinRoom(room)}
            onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
          >
            Join Room
          </button>
        </div>
      ))}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div style={styles.modal} onClick={() => setShowCreateRoom(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>Create a Room</div>
            <input 
              style={styles.formInput}
              placeholder="Room name"
              value={newRoom.name}
              onChange={(e) => setNewRoom({...newRoom, name: e.target.value})}
            />
            <input 
              style={styles.formInput}
              placeholder="Topic"
              value={newRoom.topic}
              onChange={(e) => setNewRoom({...newRoom, topic: e.target.value})}
            />
            <select 
              style={styles.formSelect}
              value={newRoom.type}
              onChange={(e) => setNewRoom({...newRoom, type: e.target.value})}
            >
              <option value="audio">🎧 Audio</option>
              <option value="video">📹 Video</option>
            </select>
            <button style={styles.formBtn} onClick={createRoom}>Create Room</button>
            <button style={styles.cancelBtn} onClick={() => setShowCreateRoom(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}