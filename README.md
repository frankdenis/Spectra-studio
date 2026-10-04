# Spectra Studio

**Spectra Studio** is a responsive, installable realtime AI video workspace for live rooms, AI presence, collaboration, recordings, and multimodal interaction.

## Product identity

- **App title:** Spectra Studio
- **Short name:** Spectra Studio
- **AI presence:** Aurora
- **Realtime engine:** Phoenix
- **Platform:** Responsive Web + PWA
- **Distribution targets:** Android, iOS/iPadOS, Windows, macOS, Linux, and modern browsers
- **Primary category:** Productivity / Communication
- **App icon:** `public/icon.svg`
- **Metadata:** Web manifest, Open Graph, Twitter card, Apple PWA metadata, theme colors, installable service worker

## Device experience

The interface uses fluid sizing, responsive grids, touch-safe controls, safe-area insets, compact navigation, and viewport-fit support. It is designed to adapt across:

- Android phones and tablets
- iPhone and iPad
- Windows laptops, desktops, and touch devices
- macOS laptops and desktops
- Linux desktops
- Chromium, Safari, Firefox, and Edge class browsers

No fixed desktop canvas is used as the mobile experience. Layouts collapse progressively for narrow screens, tablets, and wide desktop displays.

## Install / distribution

### Web / PWA
Deploy the Vite build to HTTPS. Users can install Spectra Studio from a supported browser.

### Android
Use the PWA for browser installation, or package the same web app with a trusted Android wrapper such as Trusted Web Activity when native store distribution is required.

### iOS / iPadOS
Use Safari's Add to Home Screen for PWA installation. For App Store distribution, package the production web experience with an approved native shell and complete Apple's signing, privacy, and review requirements.

### Windows / macOS / Linux
Use the PWA installation flow for supported browsers. For a desktop-store build, package the same production frontend with an approved desktop shell after native capabilities are finalized.

## Store metadata

**Title:** Spectra Studio

**Short description:** Realtime AI video rooms with presence, collaboration, and multimodal interaction.

**Long description:** Spectra Studio is a realtime AI video workspace built for natural conversations between people and AI. Create private rooms, bring people into a session, monitor connection quality, work with AI presence, review recordings, and build a calmer, more focused way to communicate.

**Keywords:** AI video, AI assistant, video rooms, realtime AI, collaboration, meetings, productivity, multimodal AI, virtual presence.

## Production status

The repository now has production-oriented identity, metadata, installability, cache versioning, and responsive distribution foundations. Backend authentication, persistent room data, real WebRTC signaling/media, AI streaming, recordings, and provider credentials must still be connected before claiming the product is fully live.
