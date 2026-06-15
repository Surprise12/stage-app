// src/components/AudioUploader.jsx
import React, { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function AudioUploader({ session, onUploadComplete }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [waveform, setWaveform] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const audioRef = useRef(null)
  const canvasRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && (selectedFile.type === 'audio/wav' || selectedFile.type === 'audio/flac' || selectedFile.type === 'audio/mpeg')) {
      setFile(selectedFile)
      const url = URL.createObjectURL(selectedFile)
      setPreviewUrl(url)
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
    ctx.fillStyle = '#7c3aed'
    
    data.forEach((value, i) => {
      const barHeight = value * height
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
    })
  }

  const handleUpload = async () => {
    if (!file || !title) {
      alert('Please provide title and audio file')
      return
    }

    setUploading(true)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${session.user.id}_${Date.now()}.${fileExt}`
    const filePath = `audio/${fileName}`

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

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath)

    const { error } = await supabase
      .from('audio_tracks')
      .insert({
        user_id: session.user.id,
        title: title,
        audio_url: publicUrl,
        duration: audioRef.current?.duration || 0,
        waveform_data: waveform,
        plays_count: 0
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Audio uploaded successfully!')
      setFile(null)
      setTitle('')
      setPreviewUrl(null)
      setWaveform(null)
      if (onUploadComplete) onUploadComplete()
    }
    setUploading(false)
  }

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h3>🎧 Studio Quality Audio Upload</h3>
      <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>Supports WAV, FLAC, MP3 - Lossless quality preserved</p>
      
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <input 
          type="text" 
          className="input" 
          placeholder="Track Title *" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <input 
          type="file" 
          accept="audio/wav,audio/flac,audio/mpeg" 
          onChange={handleFileSelect}
          className="input"
        />
      </div>
      
      {previewUrl && (
        <div style={{ marginBottom: '16px' }}>
          <audio ref={audioRef} controls src={previewUrl} style={{ width: '100%' }} />
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={60} 
            style={{ width: '100%', height: '60px', marginTop: '12px', background: '#1a1a1a', borderRadius: '8px' }}
          />
        </div>
      )}
      
      <button 
        className="btn btn-primary" 
        onClick={handleUpload} 
        disabled={uploading || !file || !title}
        style={{ width: '100%' }}
      >
        {uploading ? 'Uploading...' : 'Upload Studio Quality Audio'}
      </button>
    </div>
  )
}