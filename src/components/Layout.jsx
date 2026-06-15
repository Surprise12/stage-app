// src/components/Layout.jsx
import React from 'react'
import LeftSidebar from './LeftSidebar'
import RightSidebar from './RightSidebar'

export default function Layout({ children, session }) {
  return (
    <div className="main-container">
      <LeftSidebar session={session} />
      <div className="feed-container">
        {children}
      </div>
      <RightSidebar session={session} />
    </div>
  )
}