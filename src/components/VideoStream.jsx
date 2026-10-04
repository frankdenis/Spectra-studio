import React from 'react'
import AvatarRenderer from './AvatarRenderer.jsx'
import FaceCamera from './FaceCamera.jsx'

export default function VideoStream({ cameraEnabled, onCameraToggle, expression, onOpenRoom }) {
  return (
    <section className="stream-section">
      <div className="section-kicker"><span className="section-index">01</span><span>Live workspace</span><span className="live-chip"><i /> Broadcast ready</span></div>
      <div className="stream-grid">
        <div className="stream-tile stream-tile--ai">
          <div className="tile-topline"><span>PHOENIX / AI PRESENCE</span><span>4K · 60 FPS</span></div>
          <AvatarRenderer mood={expression.toLowerCase()} />
          <div className="tile-bottomline"><span>Aurora <em>AI host</em></span><span className="speaking"><i /> Listening</span></div>
        </div>
        <div className="stream-tile stream-tile--camera">
          <FaceCamera enabled={cameraEnabled} onToggle={onCameraToggle} />
        </div>
      </div>
      <div className="stream-footer">
        <span><b>01</b> room participant</span>
        <span className="stream-footer-center"><span className="signal-bars"><i /><i /><i /><i /></span> Signal strong</span>
        <button type="button" className="text-button" onClick={onOpenRoom}>Open full room <span>↗</span></button>
      </div>
    </section>
  )
}
