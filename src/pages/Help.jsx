// src/pages/Help.jsx
import React, { useState } from 'react'

export default function Help() {
  const [activeFaq, setActiveFaq] = useState(null)

  const faqs = [
    {
      question: 'How do I create a post?',
      answer: 'Click on the "Create Post" box at the top of your feed. You can add text, images, and tags. Then click "Post" to share it with your followers.'
    },
    {
      question: 'How do I get verified?',
      answer: 'Go to Settings → Verification and submit a request. You\'ll need to provide links to your music and explain why you should be verified.'
    },
    {
      question: 'How do I monetize my content?',
      answer: 'Upgrade to the Pro or Enterprise plan to access monetization tools, fan subscriptions, and virtual concerts.'
    },
    {
      question: 'How do I collaborate with other artists?',
      answer: 'Use the Collaboration Finder to discover artists with similar genres and styles. Send them a collaboration request.'
    },
    {
      question: 'How do I report inappropriate content?',
      answer: 'Click the three dots on any post or video and select "Report". Our moderation team will review it within 24 hours.'
    }
  ]

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
      marginBottom: '24px'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: '16px'
    },
    faqQuestion: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      cursor: 'pointer',
      padding: '12px 0',
      fontWeight: '700',
      fontSize: '16px'
    },
    faqAnswer: {
      padding: '12px 0 16px 0',
      color: '#6b7280',
      borderTop: '1px solid #f3f4f6',
      lineHeight: '1.6'
    },
    contactBtn: {
      padding: '12px 24px',
      background: '#7c3aed',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      fontWeight: '700',
      fontSize: '16px',
      transition: 'all 0.2s',
      marginTop: '16px'
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>❓ Help & Support</h1>
      <p style={styles.subtitle}>Find answers to common questions</p>

      <div style={styles.card}>
        <h3 style={{ marginBottom: '16px' }}>Frequently Asked Questions</h3>
        {faqs.map((faq, index) => (
          <div key={index}>
            <div
              style={styles.faqQuestion}
              onClick={() => setActiveFaq(activeFaq === index ? null : index)}
            >
              <span>{faq.question}</span>
              <span style={{ fontSize: '20px' }}>
                {activeFaq === index ? '−' : '+'}
              </span>
            </div>
            {activeFaq === index && (
              <div style={styles.faqAnswer}>
                {faq.answer}
              </div>
            )}
            {index < faqs.length - 1 && <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6' }} />}
          </div>
        ))}
      </div>

      <div style={{...styles.card, textAlign: 'center'}}>
        <h3 style={{ marginBottom: '8px' }}>Still need help?</h3>
        <p style={{ color: '#6b7280', marginBottom: '16px' }}>
          Contact our support team and we'll get back to you within 24 hours.
        </p>
        <button
          style={styles.contactBtn}
          onClick={() => window.location.href = 'mailto:support@socialvibe.com'}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
        >
          📧 Contact Support
        </button>
      </div>
    </div>
  )
}