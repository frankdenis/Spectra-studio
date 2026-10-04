export function registerPWA() {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline support is progressive enhancement; the app still works online.
    })
  })
}
