import React, { useEffect, useRef } from 'react'

export default function AvatarRenderer({ name = 'AI Identity', mood = 'focused', videoUrl = null, compact = false }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.srcObject = null
      videoRef.current.src = videoUrl
      videoRef.current.play().catch(() => {})
    }
  }, [videoUrl])

  return (
    <div className={`avatar-renderer ${compact ? 'avatar-renderer--compact' : ''}`} data-mood={mood}>
      {videoUrl ? <video ref={videoRef} className="avatar-video" autoPlay playsInline muted /> : (
        <div className="avatar-orb" aria-label="AI identity video waiting for provider">
          <div className="avatar-face"><span className="face-eye face-eye--left" /><span className="face-eye face-eye--right" /><span className="face-nose" /><span className="face-mouth" /></div>
        </div>
      )}
      <div className="avatar-meta"><span className="avatar-presence-dot" /><span>{name}</span><span className="avatar-mood">{videoUrl ? mood : 'provider waiting'}</span></div>
    </div>
  )
}