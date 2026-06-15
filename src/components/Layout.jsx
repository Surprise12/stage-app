import React from 'react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'

export default function Layout({ children, session }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr 320px',
      gap: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px',
      position: 'relative'
    }}>
      {/* Left Sidebar - Navigation */}
      <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <LeftSidebar session={session} />
      </div>
      
      {/* Main Content - Feed */}
      <div style={{ minHeight: '100vh' }}>
        {children}
      </div>
      
      {/* Right Sidebar - Trending & Suggestions */}
      <div style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 80px)', overflowY: 'auto' }}>
        <RightSidebar session={session} />
      </div>
    </div>
  )
}