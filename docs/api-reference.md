# Helio Realtime API reference

## Client modules

### `src/api/avatarAPI.js`

- `getAvatarProfile(avatarId)` returns the selected Phoenix avatar profile.
- `setAvatarExpression(avatarId, expression)` updates the active emotional state.

### `src/api/realtimeAPI.js`

- `createRoom({ title, avatarId })` creates the local room descriptor.
- `getConnectionHealth()` returns latency, packet loss, and health status.

### `src/services/RealtimeSync.js`

`createRealtimeSync({ onEvent })` creates a small event-driven sync adapter.

Supported events:

```js
{ type: 'connected', at: 1710000000000 }
{ type: 'presence', value: 97 }
{ type: 'disconnected', at: 1710000000000 }
```

### `src/services/FaceDetection.js`

`createFaceDetector()` exposes `start`, `stop`, and `read` for the client-side face presence layer. The production version should be backed by a WebAssembly or GPU model.

### `src/models/PhoenixIntegration.js`

The Phoenix integration describes the WebRTC avatar session and its supported capabilities: lip sync, face landmarks, voice turn-taking, and emotion state.

## Production notes

1. Keep API secrets on the server. The browser should receive short-lived room tokens only.
2. Create a WebRTC peer connection per room and use a data channel for expression and presence events.
3. Gate camera and microphone access behind an explicit user action.
4. Persist transcript data only after the user grants consent.
5. Replace the placeholder avatar orb with the Phoenix renderer or a `<canvas>`-based model.
