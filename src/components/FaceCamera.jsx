import React, { useRef, useState } from 'react'

export default function FaceCamera({ enabled = false, onToggle, onStream }) {
  const videoRef = useRef(null)
  const [permission, setPermission] = useState('idle')

  const toggleCamera = async () => {
    if (enabled) {
      const stream = videoRef.current?.srcObject
      stream?.getTracks().forEach((track) => track.stop())
      if (videoRef.current) videoRef.current.srcObject = null
      onStream?.(null)
      onToggle?.(false)
      setPermission('idle')
      return
    }

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        onStream?.(stream)
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