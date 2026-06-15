// src/components/AudioUploader.jsx
import React, { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function AudioUploader({ session, onUploadComplete }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [waveform, setWaveform] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)
  const canvasRef = useRef(null)

  const genres = [
    'Hip Hop', 'Trap', 'R&B', 'Pop', 'EDM', 'Lo-fi', 
    'Drill', 'Afrobeat', 'Dancehall', 'Reggaeton', 'Jazz', 
    'Classical', 'Rock', 'Alternative', 'House', 'Techno'
  ]

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && (selectedFile.type === 'audio/wav' || selectedFile.type === 'audio/flac' || selectedFile.type === 'audio/mpeg')) {
      setFile(selectedFile)
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
      
      // Get duration
      const audio = new Audio(url)
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration)
      })
      
      generateWaveform(selectedFile)
    } else {
      alert('Please upload WAV, FLAC, or MP3 file')
    }
  }

  const generateWaveform = (audioFile) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      const arrayBuffer = e.target.result
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const channelData = audioBuffer.getChannelData(0)
      const samples = 100
      const blockSize = Math.floor(channelData.length / samples)
      const waveformData = []
      
      for (let i = 0; i < samples; i++) {
        let sum = 0
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j])
        }
        waveformData.push(sum / blockSize)
      }
      setWaveform(waveformData)
      drawWaveform(waveformData)
    }
    reader.readAsArrayBuffer(audioFile)
  }

  const drawWaveform = (data) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const barWidth = width / data.length
    
    ctx.clearRect(0, 0, width, height)
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, width, 0)
    gradient.addColorStop(0, '#7c3aed')
    gradient.addColorStop(0.5, '#ec4899')
    gradient.addColorStop(1, '#f59e0b')
    ctx.fillStyle = gradient
    
    data.forEach((value, i) => {
      const barHeight = value * height
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
    })
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleUpload = async () => {
    if (!file || !title) {
      alert('Please provide title and audio file')
      return
    }

    setUploading(true)
    setUploadProgress(10)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
    const filePath = `audio/${fileName}`

    setUploadProgress(30)

    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: '3600'
      })

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    setUploadProgress(70)

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath)

    setUploadProgress(90)

    const tagArray = tags.split(',').map(t => t.trim()).filter(t => t)

    const { error } = await supabase
      .from('audio_tracks')
      .insert({
        user_id: session.user.id,
        title: title,
        description: description,
        genre: genre,
        tags: tagArray,
        is_public: isPublic,
        audio_url: publicUrl,
        duration: duration,
        waveform_data: waveform,
        plays_count: 0,
        likes_count: 0
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Audio uploaded successfully!')
      setFile(null)
      setTitle('')
      setDescription('')
      setGenre('')
      setTags('')
      setIsPublic(true)
      setPreviewUrl(null)
      setWaveform(null)
      setUploadProgress(100)
      if (onUploadComplete) onUploadComplete()
    }
    setUploading(false)
  }

  const removeFile = () => {
    setFile(null)
    setPreviewUrl(null)
    setWaveform(null)
    setDuration(0)
    if (audioRef.current) {
      audioRef.current.src = ''
    }
  }

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h3>🎧 Studio Quality Audio Upload</h3>
      <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>
        Supports WAV, FLAC, MP3 - Lossless quality preserved. Maximum file size: 100MB
      </p>
      
      {/* Title Input */}
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>Track Title *</label>
        <input 
          type="text" 
          className="input" 
          placeholder="Enter track title" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      
      {/* Description Input */}
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>Description</label>
        <textarea 
          className="input" 
          placeholder="Describe your track..." 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows="2"
        />
      </div>
      
      {/* Genre and Tags */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>Genre</label>
          <select 
            className="input" 
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">Select genre</option>
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>Tags (comma separated)</label>
          <input 
            type="text" 
            className="input" 
            placeholder="e.g., beat, instrumental, chill" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>
      </div>
      
      {/* Privacy Setting */}
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Make this track public (visible to everyone)</span>
        </label>
      </div>
      
      {/* File Upload */}
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontWeight: 'bold' }}>Audio File *</label>
        <div 
          className="proof-upload-area" 
          style={{ 
            border: '2px dashed #aaa', 
            borderRadius: '16px', 
            padding: '20px', 
            textAlign: 'center', 
            cursor: 'pointer',
            background: file ? 'rgba(124,58,237,0.05)' : 'transparent'
          }}
          onClick={() => document.getElementById('audioFileInput').click()}
        >
          <i className="fas fa-cloud-upload-alt" style={{ fontSize: '30px', color: '#7c3aed' }}></i>
          <p style={{ marginTop: '8px', color: '#666' }}>
            {file ? file.name : 'Click or drag to upload audio file'}
          </p>
          <p style={{ fontSize: '11px', color: '#999' }}>WAV, FLAC, MP3 (max 100MB)</p>
          {file && (
            <button 
              className="btn btn-outline btn-small" 
              style={{ marginTop: '8px' }}
              onClick={(e) => { e.stopPropagation(); removeFile() }}
            >
              Remove
            </button>
          )}
        </div>
        <input 
          type="file" 
          id="audioFileInput"
          accept="audio/wav,audio/flac,audio/mpeg" 
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
      
      {/* Preview Section */}
      {previewUrl && (
        <div style={{ marginBottom: '16px', padding: '16px', background: '#1a1a1a', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: 'bold' }}>Preview</span>
            <span style={{ fontSize: '12px', color: '#888' }}>{formatDuration(duration)}</span>
          </div>
          <audio ref={audioRef} controls src={previewUrl} style={{ width: '100%', marginBottom: '12px' }} />
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={60} 
            style={{ width: '100%', height: '60px', background: '#0a0a0a', borderRadius: '8px' }}
          />
        </div>
      )}
      
      {/* Upload Progress */}
      {uploading && uploadProgress < 100 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ background: '#2a2a2a', borderRadius: '10px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #ec4899)', borderRadius: '10px', transition: 'width 0.3s' }}></div>
          </div>
        </div>
      )}
      
      {/* Upload Button */}
      <button 
        className="btn btn-primary" 
        onClick={handleUpload} 
        disabled={uploading || !file || !title}
        style={{ width: '100%' }}
      >
        {uploading ? 'Uploading...' : '🎧 Upload Studio Quality Audio'}
      </button>
      
      {/* Tips Section */}
      <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(124,58,237,0.1)', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <i className="fas fa-lightbulb" style={{ color: '#f59e0b' }}></i>
          <span style={{ fontWeight: 'bold', fontSize: '13px' }}>Pro Tips</span>
        </div>
        <ul style={{ fontSize: '11px', color: '#888', marginLeft: '20px' }}>
          <li>Use high-quality WAV or FLAC files for best sound quality</li>
          <li>Add descriptive tags to help others discover your track</li>
          <li>Public tracks can be featured in playlists and reach more listeners</li>
        </ul>
      </div>
    </div>
  )
}