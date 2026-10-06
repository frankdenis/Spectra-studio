export function registerPWA() {
  // Never register a service worker in Vite development mode: it can cache HMR modules and make previews look stale.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is progressive enhancement; the app still works online.
    })
  })
}
