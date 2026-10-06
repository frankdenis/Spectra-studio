import React, { useEffect, useRef } from 'react'
import FaceCamera from './FaceCamera.jsx'

export default function VideoStream({ cameraEnabled, onCameraToggle, onLocalStream, onOpenRoom, remoteStream = null }) {
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return
    remoteVideoRef.current.srcObject = remoteStream
    remoteVideoRef.current.play().catch(() => {})
  }, [remoteStream])

  return (
    <section className="stream-section">
      <div className="section-kicker"><span className="section-index">01</span><span>Live workspace</span><span className="live-chip"><i /> Realtime</span></div>
      <div className="stream-grid">
        <div className="stream-tile stream-tile--ai">
          <div className="tile-topline"><span>AI PARTICIPANT</span><span>{remoteStream ? 'LIVE' : 'WAITING'}</span></div>
          <div className="remote-video-frame">{remoteStream ? <video ref={remoteVideoRef} autoPlay playsInline /> : <div className="provider-waiting">AI video participant will appear when the realtime provider connects.</div>}</div>
          <div className="tile-bottomline"><span>AI identity <em>realtime participant</em></span><span className="speaking"><i /> {remoteStream ? 'Live' : 'Waiting'}</span></div>
        </div>
        <div className="stream-tile stream-tile--camera"><FaceCamera enabled={cameraEnabled} onToggle={onCameraToggle} onStream={onLocalStream} /></div>
      </div>
      <div className="stream-footer">
        <span><b>01</b> authenticated participant</span>
        <span className="stream-footer-center"><span className="signal-bars"><i /><i /><i /><i /></span> Realtime status</span>
        <button type="button" className="text-button" onClick={onOpenRoom}>Open full room <span>↗</span></button>
      </div>
    </section>
  )
}