// src/pages/About.jsx - UPDATED WITH SVG SOCIAL ICONS
import React from 'react'

export default function About() {
  // Social Icons as SVG components
  const SocialIcons = {
    GitHub: ({ size = 24, color = '#333' }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
      </svg>
    ),
    Facebook: ({ size = 24, color = '#1877f2' }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    TikTok: ({ size = 24, color = '#000' }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M12.525.02c1.31-.016 2.61.014 3.92.02.035 1.67.035 3.34.048 5.01 1.36-.44 2.76-.68 4.22-.55v3.45c-1.41.15-2.83.45-4.19 1.16.03 1.98.03 3.96.04 5.95-1.04 3.15-3.52 4.96-6.77 5.03-2.91.06-5.49-1.14-7.02-3.58-1.34-2.14-1.44-5.12-.35-7.35 1.34-2.77 3.9-4.02 6.79-4.17.01 1.66.04 3.32.05 4.98-1.07.22-2.04.68-2.75 1.52-.79.93-1.09 2.06-.77 3.21.65 2.26 3.39 3.01 4.82 1.43.52-.56.79-1.31.77-2.01-.02-1.67-.01-3.35-.01-5.02 0-1.66-.02-3.32-.05-4.98z"/>
      </svg>
    ),
    WhatsApp: ({ size = 24, color = '#25d366' }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    Instagram: ({ size = 24, color = '#E4405F' }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    ),
    Twitter: ({ size = 24, color = '#1da1f2' }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    )
  }

  const styles = {
    container: {
      maxWidth: '800px',
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
    cardGradient: {
      background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(236,73,153,0.08))',
      borderRadius: '16px',
      padding: '24px',
      border: '2px solid rgba(124,58,237,0.2)',
      marginBottom: '16px'
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '700',
      marginBottom: '12px'
    },
    text: {
      color: '#4b5563',
      lineHeight: '1.8',
      marginBottom: '12px',
      fontWeight: '700'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginTop: '16px'
    },
    statBox: {
      background: '#f9fafb',
      padding: '16px',
      borderRadius: '12px',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#7c3aed'
    },
    statLabel: {
      fontSize: '14px',
      color: '#6b7280',
      fontWeight: '700'
    },
    developerSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap'
    },
    developerAvatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '32px',
      fontWeight: '700',
      flexShrink: 0
    },
    developerInfo: {
      flex: 1
    },
    developerName: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937'
    },
    developerRole: {
      fontSize: '14px',
      color: '#7c3aed',
      fontWeight: '700',
      marginTop: '2px'
    },
    developerDetails: {
      fontSize: '13px',
      color: '#6b7280',
      fontWeight: '700',
      marginTop: '4px'
    },
    techStack: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '12px'
    },
    techBadge: {
      padding: '4px 14px',
      background: '#f3f4f6',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      color: '#1f2937'
    },
    socialLinks: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '12px',
      marginTop: '12px'
    },
    socialLink: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      border: '1px solid #e5e7eb',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      color: '#1f2937',
      cursor: 'pointer',
      textDecoration: 'none',
      transition: 'all 0.2s',
      background: 'white'
    },
    socialLinkHover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    universityBadge: {
      display: 'inline-block',
      padding: '4px 16px',
      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      color: 'white',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
      marginTop: '8px'
    }
  }

  const techStack = [
    'React', 'Supabase', 'Node.js', 'Vite', 'JavaScript', 'CSS3'
  ]

  const handleSocialClick = (url) => {
    window.open(url, '_blank')
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>ℹ️ About SocialVibe</h1>
      <p style={styles.subtitle}>The ultimate platform for creators and fans</p>

      {/* Developer Info - Featured Card */}
      <div style={styles.cardGradient}>
        <h2 style={styles.sectionTitle}>👨‍💻 Developer</h2>
        <div style={styles.developerSection}>
          <div style={styles.developerAvatar}>MM</div>
          <div style={styles.developerInfo}>
            <div style={styles.developerName}>Mpho Modimakss</div>
            <div style={styles.developerRole}>Full-Stack Developer & Creator</div>
            <div style={styles.developerDetails}>
              📍 North West University, South Africa
            </div>
            <div style={styles.developerDetails}>
              🎓 4th Year - Computer Sciences & Mathematics
            </div>
            <span style={styles.universityBadge}>🏛️ NWU Student</span>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>🚀 Our Mission</h2>
        <p style={styles.text}>
          SocialVibe is a creator-first platform designed to empower artists, musicians, 
          and creators to connect with their audience, collaborate with others, and 
          monetize their content. We believe in the power of community and creative expression.
        </p>
      </div>

      {/* Tech Stack */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>🛠️ Built With</h2>
        <div style={styles.techStack}>
          {techStack.map(tech => (
            <span key={tech} style={styles.techBadge}>{tech}</span>
          ))}
        </div>
        <p style={{...styles.text, marginTop: '12px', fontSize: '13px'}}>
          SocialVibe is built using modern web technologies to provide a seamless 
          and responsive experience across all devices.
        </p>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📊 Platform Stats</h2>
        <div style={styles.grid}>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>10K+</div>
            <div style={styles.statLabel}>Active Users</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>5K+</div>
            <div style={styles.statLabel}>Verified Artists</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>50K+</div>
            <div style={styles.statLabel}>Posts Created</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statNumber}>100+</div>
            <div style={styles.statLabel}>Countries</div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>✨ Key Features</h2>
        <ul style={{ color: '#4b5563', lineHeight: '2', fontWeight: '700' }}>
          <li>🎵 Share music, videos, and content</li>
          <li>🤝 Collaborate with other creators</li>
          <li>🎪 Host virtual concerts and events</li>
          <li>📈 Analytics and monetization tools</li>
          <li>👥 Groups and community features</li>
          <li>📄 Create and follow pages</li>
        </ul>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>🎓 Academic Project</h2>
        <p style={styles.text}>
          SocialVibe is a 4th-year project developed at North West University as part 
          of the Computer Sciences & Mathematics program. The project demonstrates 
          the application of modern web technologies to solve real-world problems 
          in the creative industry.
        </p>
        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ background: '#f3f4f6', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
            📅 2025
          </div>
          <div style={{ background: '#f3f4f6', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
            🎓 BSc Computer Sciences & Mathematics
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📬 Connect With Me</h2>
        <p style={styles.text}>
          Follow me on social media or reach out via email!
        </p>
        <div style={styles.socialLinks}>
          {/* GitHub */}
          <div 
            style={styles.socialLink}
            onClick={() => handleSocialClick('https://github.com')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              e.currentTarget.style.borderColor = '#333'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            <SocialIcons.GitHub size={20} color="#333" />
            <span>GitHub</span>
          </div>

          {/* Facebook */}
          <div 
            style={styles.socialLink}
            onClick={() => handleSocialClick('https://facebook.com')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              e.currentTarget.style.borderColor = '#1877f2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            <SocialIcons.Facebook size={20} color="#1877f2" />
            <span>Facebook</span>
          </div>

          {/* TikTok */}
          <div 
            style={styles.socialLink}
            onClick={() => handleSocialClick('https://tiktok.com')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              e.currentTarget.style.borderColor = '#000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            <SocialIcons.TikTok size={20} color="#000" />
            <span>TikTok</span>
          </div>

          {/* WhatsApp */}
          <div 
            style={styles.socialLink}
            onClick={() => handleSocialClick('https://wa.me')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              e.currentTarget.style.borderColor = '#25d366'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            <SocialIcons.WhatsApp size={20} color="#25d366" />
            <span>WhatsApp</span>
          </div>

          {/* Instagram */}
          <div 
            style={styles.socialLink}
            onClick={() => handleSocialClick('https://instagram.com')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              e.currentTarget.style.borderColor = '#E4405F'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            <SocialIcons.Instagram size={20} color="#E4405F" />
            <span>Instagram</span>
          </div>

          {/* Twitter/X */}
          <div 
            style={styles.socialLink}
            onClick={() => handleSocialClick('https://twitter.com')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              e.currentTarget.style.borderColor = '#1da1f2'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#e5e7eb'
            }}
          >
            <SocialIcons.Twitter size={20} color="#1da1f2" />
            <span>Twitter/X</span>
          </div>

          {/* Email */}
          <div 
            style={{...styles.socialLink, color: '#7c3aed', borderColor: '#7c3aed'}}
            onClick={() => window.location.href = 'mailto:mphodimakss@gmail.com'}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              e.currentTarget.style.background = '#7c3aed'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.color = '#7c3aed'
            }}
          >
            <span style={{ fontSize: '18px' }}>📧</span>
            <span>Email</span>
          </div>
        </div>
      </div>
    </div>
  )
}