export function createFaceDetector() {
  let active = false
  return {
    start() { active = true; return { active, confidence: 0.98 } },
    stop() { active = false; return { active } },
    read() { return { active, presence: active ? 'detected' : 'idle', confidence: active ? 0.98 : 0 } },
  }
}

export const faceDetectionConfig = { model: 'mesh-lite', intervalMs: 80, landmarks: 468 }
