import React from 'react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function EagleLogo({ size = 'md', className = '' }: Props) {
  const dims = { sm: { w: 36, h: 24 }, md: { w: 60, h: 40 }, lg: { w: 88, h: 60 } }
  const { w, h } = dims[size]

  return (
    <svg
      width={w} height={h}
      viewBox="0 0 120 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="wl" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e7fd4"/>
          <stop offset="100%" stopColor="#0d5aa8"/>
        </linearGradient>
        <linearGradient id="wr" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e8621a"/>
          <stop offset="100%" stopColor="#c44810"/>
        </linearGradient>
        <linearGradient id="bd" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4dde8"/>
          <stop offset="100%" stopColor="#8fa3be"/>
        </linearGradient>
      </defs>
      {/* Left wing - blue */}
      <path d="M60 35 L6 13 L11 24 L3 20 L14 34 L6 34 L19 45 L30 37 Z" fill="url(#wl)" opacity=".95"/>
      <path d="M60 35 L14 8 L19 19 L10 14 Z" fill="#1e7fd4" opacity=".65"/>
      {/* Right wing - ember */}
      <path d="M60 35 L114 13 L109 24 L117 20 L106 34 L114 34 L101 45 L90 37 Z" fill="url(#wr)" opacity=".95"/>
      <path d="M60 35 L106 8 L101 19 L110 14 Z" fill="#e8621a" opacity=".65"/>
      {/* Body */}
      <ellipse cx="60" cy="38" rx="11" ry="13" fill="url(#bd)"/>
      {/* Circuit lines */}
      <line x1="55" y1="37" x2="50" y2="41" stroke="#1e7fd4" strokeWidth=".8" opacity=".85"/>
      <line x1="50" y1="41" x2="50" y2="46" stroke="#1e7fd4" strokeWidth=".8" opacity=".85"/>
      <circle cx="50" cy="46" r="1.5" fill="#1e7fd4" opacity=".95"/>
      <line x1="65" y1="37" x2="70" y2="41" stroke="#e8621a" strokeWidth=".8" opacity=".85"/>
      <line x1="70" y1="41" x2="70" y2="46" stroke="#e8621a" strokeWidth=".8" opacity=".85"/>
      <circle cx="70" cy="46" r="1.5" fill="#e8621a" opacity=".95"/>
      <line x1="55" y1="39" x2="65" y2="39" stroke="#d4dde8" strokeWidth=".6" opacity=".5"/>
      {/* Head */}
      <ellipse cx="60" cy="26" rx="7" ry="8" fill="url(#bd)"/>
      <path d="M60 30 L56 33 L60 32 Z" fill="#f0c060"/>
      <circle cx="57" cy="25" r="2" fill="#0a1020"/>
      <circle cx="57.5" cy="25" r=".9" fill="#1e7fd4"/>
    </svg>
  )
}
