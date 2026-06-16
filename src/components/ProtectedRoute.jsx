// src/components/ProtectedRoute.jsx - Simplified version
import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ session, children }) {
  console.log('ProtectedRoute: Checking session:', session ? 'Yes' : 'No')
  
  if (!session) {
    console.log('ProtectedRoute: No session, redirecting to login')
    return <Navigate to="/login" replace />
  }
  
  console.log('ProtectedRoute: Session OK, rendering children')
  return children
}