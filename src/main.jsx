import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { registerPWA } from './registerPWA.js'
import './styles.css'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error) {
    console.error('Spectra Studio runtime error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="runtime-error-screen">
          <div className="runtime-error-card">
            <span className="auth-kicker">SPECTRA STUDIO</span>
            <h1>Something interrupted the workspace.</h1>
            <p>The app hit an unexpected runtime error. Reload Spectra Studio to start a clean session.</p>
            <button type="button" className="primary-button" onClick={() => window.location.reload()}>
              Reload Spectra Studio <span>↗</span>
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)

registerPWA()
