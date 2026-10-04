import React from 'react'

export default function AvatarRenderer({ name = 'Aurora', mood = 'focused', compact = false }) {
  return (
    <div className={`avatar-renderer ${compact ? 'avatar-renderer--compact' : ''}`} data-mood={mood}>
      <div className="avatar-halo" />
      <div className="avatar-orb">
        <div className="avatar-face">
          <span className="face-eye face-eye--left" />
          <span className="face-eye face-eye--right" />
          <span className="face-nose" />
          <span className="face-mouth" />
        </div>
      </div>
      <div className="avatar-meta">
        <span className="avatar-presence-dot" />
        <span>{name}</span>
        <span className="avatar-mood">{mood}</span>
      </div>
    </div>
  )
}
