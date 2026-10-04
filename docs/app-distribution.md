# Spectra Studio — App Distribution

## Canonical product identity

| Field | Value |
|---|---|
| App title | Spectra Studio |
| Short name | Spectra Studio |
| AI persona | Aurora |
| Realtime engine | Phoenix |
| Primary category | Productivity / Communication |
| Web type | Responsive PWA |
| Package strategy | Web/PWA first, native wrappers for stores |
| Icon source | `public/icon.svg` |

## Store-ready copy

**Short description**

Realtime AI video rooms with presence, collaboration, and multimodal interaction.

**Long description**

Spectra Studio is a realtime AI video workspace built for natural conversations between people and AI. Create private rooms, invite participants, monitor connection quality, work with AI presence, and review recordings in a focused workspace designed to adapt from phone screens to large desktop displays.

**Keywords**

AI video, AI assistant, realtime AI, video rooms, collaboration, meetings, productivity, multimodal AI, virtual presence.

## Distribution matrix

| Target | Recommended distribution | UI target |
|---|---|---|
| Android | Installable PWA; Android wrapper/TWA for Play distribution | Phone + tablet |
| iPhone | Safari PWA; approved native shell for App Store | Small + large phone |
| iPad | Safari PWA; approved native shell for App Store | Tablet / split view |
| Windows | Edge/Chrome PWA; desktop wrapper if native APIs are needed | Laptop + desktop + touch |
| macOS | Safari/Chrome PWA; desktop wrapper if native APIs are needed | Laptop + desktop |
| Linux | Chromium/Firefox class PWA | Desktop |
| Web | HTTPS deployment | Responsive 280px → ultrawide |

## Icon system

The repository contains a scalable Spectra Studio icon at `public/icon.svg`. It is designed to remain crisp at browser favicon, PWA, and launcher sizes. For native store submission, generate platform-specific PNG/WebP exports from this source and validate safe-area/mask requirements in each store's current tooling.

## Release checklist

1. Deploy over HTTPS.
2. Confirm manifest and service worker registration.
3. Confirm install prompt/Add to Home Screen on supported browsers.
4. Test 280px, 320px, 375px, 390px, 430px, 768px, 820px, 1024px, 1440px and ultrawide layouts.
5. Test portrait and landscape.
6. Test camera/microphone permissions.
7. Connect production authentication, realtime signaling/media, AI streaming, storage and recordings before public launch.
8. For native stores, complete signing, privacy declarations, app screenshots, age/content classification, support URL, privacy policy URL, and store-specific review requirements.

## Important

This repository now contains the distribution foundation, not a false claim of a finished native app. Store publication still requires the native packaging/signing and the real backend/media/AI services to be connected.
