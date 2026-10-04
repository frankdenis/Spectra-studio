import React, { useRef, useState } from 'react'

export default function FaceCamera({ enabled = false, onToggle }) {
  const videoRef = useRef(null)
  const [permission, setPermission] = useState('idle')

  const toggleCamera = async () => {
    if (enabled) {
      videoRef.current?.srcObject?.getTracks().forEach((track) => track.stop())
      onToggle?.(false)
      setPermission('idle')
      return
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }
      setPermission('granted')
      onToggle?.(true)
    } catch {
      setPermission('fallback')
      onToggle?.(true)
    }
  }

  return (
    <div className="camera-card">
      <div className={`camera-viewport ${enabled ? 'camera-viewport--on' : ''}`}>
        <video ref={videoRef} muted playsInline />
        {!enabled && <div className="camera-placeholder"><div className="user-bust">AS</div><span>Preview is off</span></div>}
        {enabled && permission === 'fallback' && <div className="camera-placeholder camera-placeholder--fallback"><div className="user-bust">AS</div><span>Camera simulation active</span></div>}
        <div className="camera-label"><span className="status-dot" /> You · local feed</div>
      </div>
      <button className="camera-toggle" type="button" onClick={toggleCamera}>{enabled ? 'Disable camera' : 'Enable camera'}</button>
    </div>
  )
}
