# Helio — Realtime AI Video Room

Helio is a responsive workspace for high-presence AI video conversations. It includes the polished dashboard, a local API, a WebSocket signaling server, a WebRTC session adapter, PWA install metadata, tests, and CI.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts both services:

- Frontend: `http://localhost:5173`
- API and WebSocket server: `http://localhost:3001`

The frontend proxies `/api`, `/health`, and `/ws` to the API so browser code never calls localhost directly in a deployed environment. Production output can be generated with `npm run build`, and tests run with `npm test`.

## What is included

- `src/components/` — responsive room, camera, avatar, and expression UI.
- `src/api/` — browser API clients with real HTTP boundaries.
- `src/models/PhoenixIntegration.js` — Phoenix capability contract.
- `src/services/RealtimeSync.js` — WebSocket sync with a safe offline fallback.
- `src/services/WebRTCSession.js` — browser `RTCPeerConnection` adapter.
- `server/` — Express API, signed development tokens, JSON-backed local store, and WebSocket signaling.
- `tests/` — auth, store, API, and server smoke tests.
- `docs/api-reference.md` — endpoint and production integration notes.
- `.github/workflows/blank.yml` — install, test, build, and dependency audit CI.

## Before production

The local server is intentionally credential-free for development. Replace the JSON store with a managed database, configure a real identity provider, add TURN credentials, connect the server-side Phoenix/voice provider adapter, and set a strong `AUTH_SECRET`. Transcript retention and user consent should be implemented before storing real conversations.
