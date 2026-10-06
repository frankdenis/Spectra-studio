# Helio Realtime API reference

## Start the services

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts the Vite frontend on port 5173 and the API/WebSocket server on port 3001. Vite proxies `/api`, `/health`, and `/ws` so browser code only uses relative URLs.

For production, set `NODE_ENV=production`, use a strong `AUTH_SECRET`, provide TURN credentials, and run the API behind TLS.

## HTTP endpoints

- `GET /health` — liveness check.
- `POST /api/auth/dev` — development-only token. Disabled in production.
- `GET /api/me` — authenticated current user.
- `GET /api/rooms` — list rooms visible to the current user.
- `POST /api/rooms` — create a room with `{ title, avatarId }`.
- `GET /api/rooms/:roomId` — fetch room metadata.
- `POST /api/rooms/:roomId/invites` — create an invite with `{ email }`.
- `GET /api/rooms/:roomId/transcript` — fetch consented room events.
- `POST /api/rooms/:roomId/events` — append a room event with `{ type, text }`.
- `GET /api/avatar/:avatarId` — fetch avatar capabilities.

Authenticated requests use:

```http
Authorization: Bearer <short-lived-token>
```

## WebSocket signaling

Connect to `/ws`, then join a room:

```js
socket.send(JSON.stringify({ type: 'join', roomId: 'room_demo', clientId: 'browser-a', token }))
```

The server relays `offer`, `answer`, `ice`, `presence`, `chat`, and `leave` messages to other clients in the same room. `src/services/WebRTCSession.js` provides the browser-side `RTCPeerConnection` adapter.

## Provider integration boundaries

### `src/api/avatarAPI.js`

The browser-facing avatar client calls the API boundary. Keep Phoenix secrets server-side; do not expose provider keys in `VITE_*` variables.

### `src/models/PhoenixIntegration.js`

Describes the Phoenix model contract: lip sync, face landmarks, voice turn-taking, and emotion state. The actual provider adapter should live on the server and use `PHOENIX_API_URL`, `PHOENIX_API_KEY`, and `PHOENIX_MODEL`.

### `src/services/FaceDetection.js`

Uses the browser `FaceDetector` API when available and returns a safe fallback state otherwise. A production app should swap this for a tested WebAssembly/GPU model and request camera permission only after explicit user action.

## Production requirements

1. Replace the in-memory/JSON room store with PostgreSQL or another managed database.
2. Add a real identity provider and short-lived room tokens.
3. Configure TURN for users behind restrictive networks.
4. Add consent, retention, deletion, and transcript privacy controls.
5. Add rate limiting, structured logs, metrics, and error reporting at the edge.
6. Serve the app and API through HTTPS. WebRTC camera access and service workers require a secure context outside localhost.
