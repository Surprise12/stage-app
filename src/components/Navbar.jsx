import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import NotificationBell from './NotificationBell'

export default function Navbar({ session }) {
  const navigate = useNavigate()
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
    if (session) {
      supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          setIsAdmin(data?.is_admin || false)
        })
    }
  }, [session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const avatarUrl = session?.user?.user_metadata?.avatar_url || 
    `https://ui-avatars.com/api/?name=${session?.user?.email?.[0] || 'U'}&background=ff5f6d&color=fff`

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => navigate('/')}>STAGE</div>
      {session ? (
        <>
          <div className="nav-links">
            <Link to="/" className="nav-link">🏠 Home</Link>
            <Link to="/events" className="nav-link">📅 Events</Link>
            <Link to="/groups" className="nav-link">👥 Groups</Link>
            <Link to="/marketplace" className="nav-link">🛒 Market</Link>
            <Link to="/messages" className="nav-link">💬 Messages</Link>
            <Link to="/music" className="nav-link">🎵 Music</Link>
            <Link to="/gigs" className="nav-link">🎪 Gigs</Link>
            <Link to="/collectives" className="nav-link">👥 Groups</Link>
            <Link to="/live" className="nav-link">🔴 Live</Link>
            <Link to="/analytics" className="nav-link">📊 Analytics</Link>
            <Link to="/search" className="nav-link">🔍 Search</Link>
            <Link to="/profile" className="nav-link">⭐ Profile</Link>
            <Link to="/settings" className="nav-link">⚙️ Settings</Link>
            {isAdmin && <Link to="/admin" className="nav-link">👑 Admin</Link>}
            <NotificationBell session={session} />
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px' }}>Logout</button>
          </div>
          <img src={avatarUrl} className="avatar" alt="avatar" onClick={() => navigate('/profile')} />
        </>
      ) : (
        <div className="nav-links">
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-link">Register</Link>
        </div>
      )}
    </nav>
  )
}