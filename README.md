# Spectra Studio

**Spectra Studio** is a responsive, installable realtime AI video workspace for live rooms, AI presence, collaboration, recordings, and multimodal interaction.

## Product identity

- **App title:** Spectra Studio
- **AI presence:** Aurora
- **Realtime engine:** Phoenix
- **Platform:** Responsive Web + PWA
- **Distribution targets:** Android, iOS/iPadOS, Windows, macOS, Linux, and modern browsers

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts both services:

- Frontend: `http://localhost:5173`
- API and WebSocket signaling: `http://localhost:3001`

Vite proxies `/api`, `/health`, and `/ws` to the API server. Use `npm run dev:frontend` when you only need the frontend. Run `npm test` for tests and `npm run build` for the production bundle.

## Architecture

- `src/components/` — responsive room, camera, avatar, auth, studio, identity, and admin UI.
- `src/api/` — Supabase-backed production clients with local API fallback.
- `src/services/RealtimeSync.js` — Supabase Realtime transport with WebSocket signaling fallback.
- `src/services/WebRTCSession.js` — browser `RTCPeerConnection` adapter.
- `server/` — Express API, signed development tokens, JSON-backed local store, and WebSocket signaling.
- `api/` — authenticated media, PlayHT, and Tavus serverless boundaries already present in the product repository.
- `supabase/migrations/` — security, production hardening, billing atomicity, and admin bootstrap migrations.
- `tests/` — auth, store, API, and server smoke tests.
- `docs/api-reference.md` — endpoints and provider integration notes.

## Device experience

The interface uses fluid sizing, responsive grids, touch-safe controls, safe-area insets, compact navigation, and viewport-fit support. It adapts across Android phones/tablets, iPhone/iPad, Windows, macOS, Linux, and current Chromium, Safari, Firefox, and Edge browsers.

## Configuration

Copy `.env.example` to `.env`. For the production Supabase path, provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. For the local API path, set a strong `AUTH_SECRET` and configure `PORT`, `DATA_DIR`, and optional TURN/Phoenix provider settings. Never put provider secrets in `VITE_*` variables.

## Distribution

Deploy the Vite build to HTTPS for browser and PWA installation. Android can use the PWA or a Trusted Web Activity; iOS/iPadOS can use Add to Home Screen or an approved native shell. A signed APK requires an Android wrapper, signing key, privacy metadata, and store configuration.

## Production requirements

The repository now has UI, Supabase integration boundaries, migrations, PWA metadata, local API/signaling, tests, and CI. Before claiming the whole product is live, configure the Supabase project, deploy authenticated serverless media routes, provide TURN credentials, connect the Phoenix/voice provider, replace the local JSON store with managed persistence, and complete transcript consent/retention controls.
