# Helio — Realtime AI Video Room

A focused dashboard for starting high-presence AI video conversations. The current build is a polished front-end prototype with a Phoenix-ready architecture: avatar rendering, camera permissions, expression control, presence syncing, and a realtime API boundary are separated into small modules.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. Production output can be generated with `npm run build`.

## Product map

- `src/components/` — visual pieces for the room and avatar layer.
- `src/api/` — replaceable network boundaries for avatar and realtime services.
- `src/models/PhoenixIntegration.js` — model capability contract.
- `src/services/` — face presence and sync adapters.
- `docs/api-reference.md` — integration notes and event shapes.

## Interaction notes

- **Launch live room** moves the interface into a live state and updates the activity rail.
- **Enable camera** requests browser permission when available; denied permission falls back to a simulated local feed.
- The **Expression** control updates the placeholder Phoenix avatar state.
- The dashboard is intentionally usable without credentials or backend services; all network calls are safe placeholders.
