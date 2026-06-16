// src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ session, children, requiredRoles = [], requireVerified = false }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const checkAccess = async () => {
      if (!session) {
        setLoading(false)
        setHasAccess(false)
        return
      }

      try {
        // Load user profile to check roles and verification
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error loading profile:', error)
          setLoading(false)
          setHasAccess(false)
          return
        }

        setProfile(data)

        // Check if user is suspended
        if (data?.is_suspended) {
          setLoading(false)
          setHasAccess(false)
          return
        }

        // Check for required roles
        if (requiredRoles.length > 0) {
          const userRole = data?.role || 'user'
          if (!requiredRoles.includes(userRole) && !data?.is_admin) {
            setLoading(false)
            setHasAccess(false)
            return
          }
        }

        // Check for verification requirement
        if (requireVerified && !data?.is_verified) {
          setLoading(false)
          setHasAccess(false)
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error('Error checking access:', error)
        setHasAccess(false)
      }

      setLoading(false)
    }

    checkAccess()
  }, [session, requiredRoles, requireVerified])

  // Show loading state while checking access
  if (loading) {
    return (
      <div className="auth-container" style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f0f2f5'
      }}>
        <div className="spinner"></div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Redirect if access denied
  if (!hasAccess) {
    return <Navigate to="/access-denied" state={{ from: location }} replace />
  }

  // Render children with additional props
  return React.cloneElement(children, { profile })
}

// Custom hook for checking permissions in components
export function useRequireAuth(requiredRoles = [], requireVerified = false) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (!session) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(data)

      let access = true

      if (data?.is_suspended) access = false

      if (requiredRoles.length > 0) {
        const userRole = data?.role || 'user'
        if (!requiredRoles.includes(userRole) && !data?.is_admin) access = false
      }

      if (requireVerified && !data?.is_verified) access = false

      setHasAccess(access)
      setLoading(false)
    }

    checkAuth()
  }, [])

  return { session, profile, loading, hasAccess }
}