import React, { useEffect, useMemo, useRef, useState } from 'react'
import AvatarRenderer from './components/AvatarRenderer'
import VideoStream from './components/VideoStream'
import { createRoom, getConnectionHealth } from './api/realtimeAPI'
import { createRealtimeSync } from './services/RealtimeSync'
import { createWebRTCSession } from './services/WebRTCSession.js'
import AuthScreen from './components/AuthScreen'
import AdminDashboard from './components/AdminDashboard'
import IdentityLab from './components/IdentityLab'
import StudioHub from './components/StudioHub'
import AccountCenter from './components/AccountCenter'
import PlatformCenter from './components/PlatformCenter'
import { supabase } from './lib/supabase'
import { isAdminUser } from './adminConfig'

const navItems = [
  { label: 'Dashboard', icon: '⌂' },
  { label: 'Search', icon: '⌕' },
  { label: 'Notifications', icon: '♧' },
  { label: 'Create', icon: '✦' },
  { label: 'Communicate', icon: '◉' },
  { label: 'Library', icon: '▣' },
  { label: 'Identity Lab', icon: '◈' },
  { label: 'Live rooms', icon: '◎' },
]

const sessions = [
  { name: 'Product discovery', guest: 'Nadia Okafor', time: 'Today · 11:30', type: 'AI room', color: 'coral', state: 'Ready' },
  { name: 'Creative direction', guest: 'Marcus Lee', time: 'Today · 14:00', type: 'Private', color: 'violet', state: 'Scheduled' },
  { name: 'Weekly reflection', guest: 'Jules Martin', time: 'Tomorrow · 09:15', type: 'AI room', color: 'blue', state: 'Draft' },
  { name: 'Team pulse', guest: 'Arc / Studio', time: 'Fri · 16:00', type: 'Private', color: 'mint', state: 'Scheduled' },
]

function Icon({ children }) {
  return <span className="ui-icon" aria-hidden="true">{children}</span>
}

function MetricCard({ label, value, detail, tone = 'purple', children }) {
  return (
    <div className={`metric-card metric-card--${tone}`}>
      <div className="metric-label"><span>{label}</span><span className="metric-arrow">↗</span></div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail">{detail}</div>
      {children}
    </div>
  )
}

function SparkBars({ color = 'purple' }) {
  return <div className={`mini-bars mini-bars--${color}`} aria-hidden="true">{[32, 46, 38, 64, 53, 76, 61, 86, 68, 92, 76, 96].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div>
}

function Activity({ icon, title, text, time, tone }) {
  return <div className="activity-item"><div className={`activity-icon activity-icon--${tone}`}>{icon}</div><div className="activity-copy"><strong>{title}</strong><span>{text}</span></div><time>{time}</time></div>
}

function SignalPill({ children, tone = 'green' }) {
  return <span className={`signal-pill signal-pill--${tone}`}><i />{children}</span>
}

function WorkspacePanel({ activeNav, onLaunch, onInvite, onBack, onNotify, sessions = [] }) {
  const panelData = {
    'Live rooms': { eyebrow: 'LIVE STUDIO', title: 'Rooms that stay in the moment.', copy: 'Open, monitor, and shape every active AI conversation from one place.' },
    People: { eyebrow: 'PEOPLE', title: 'Your conversation circle.', copy: 'Guests, collaborators, and recurring voices in one calm workspace.' },
    Insights: { eyebrow: 'INSIGHTS', title: 'See what creates presence.', copy: 'A clear view of room quality, attention, and realtime performance.' },
    Recordings: { eyebrow: 'RECORDINGS', title: 'Every good moment, remembered.', copy: 'Review recent room captures and transcript highlights.' },
  }
  const data = panelData[activeNav] || panelData['Live rooms']

  return (
    <section className="workspace-panel">
      <div className="workspace-panel-head"><div><div className="eyebrow"><span className="eyebrow-line" /> {data.eyebrow}</div><h1>{data.title}</h1><p>{data.copy}</p></div><button type="button" className="ghost-button" onClick={onBack}>← Back to dashboard</button></div>
      {activeNav === 'Live rooms' && <div className="panel-grid"><div className="panel-feature"><div className="panel-feature-top"><SignalPill>Live now</SignalPill><span>PHOENIX / 001</span></div><AvatarRenderer name="Aurora" mood="focused" compact /><div className="panel-feature-copy"><strong>Aurora / presence room</strong><span>01 participant · {data.copy}</span></div><button type="button" className="primary-button" onClick={onLaunch}>Open live room <span>↗</span></button></div><div className="panel-list"><div className="panel-list-head"><strong>Upcoming rooms</strong><button type="button" onClick={onInvite}>＋ Invite guest</button></div>{sessions.map((session) => <button type="button" className="panel-row" key={session.name} onClick={() => onNotify(`${session.name} is ready to open.`)}><span className={`session-avatar session-avatar--${session.color}`}>{session.guest.split(' ').map(n => n[0]).join('')}</span><span><strong>{session.name}</strong><small>{session.guest} · {session.time}</small></span><span className="panel-row-arrow">↗</span></button>)}</div></div>}
      {activeNav === 'People' && <div className="panel-grid panel-grid--people"><div className="people-card"><div className="people-card-title"><strong>Active collaborators</strong><SignalPill>4 online</SignalPill></div>{['Adrian Stone','Nadia Okafor','Marcus Lee','Jules Martin'].map((person, index) => <button type="button" className="person-row" key={person} onClick={() => onNotify(`${person} is available to invite.`)}><span className={`session-avatar session-avatar--${['mint','coral','violet','blue'][index]}`}>{person.split(' ').map(n => n[0]).join('')}</span><span><strong>{person}</strong><small>{index === 0 ? 'Workspace owner' : 'Last seen today'}</small></span><span className="person-state">● online</span></button>)}</div><div className="panel-feature panel-feature--soft"><span className="panel-icon">＋</span><strong>Bring someone into the room.</strong><p>Share a private link. No account required.</p><button type="button" className="primary-button" onClick={onInvite}>Create invite <span>↗</span></button></div></div>}
      {activeNav === 'Insights' && <div className="insights-panel"><div className="insight-card insight-card--purple"><span>AVG. PRESENCE</span><strong>96.8%</strong><small>+4.2% this week</small><div className="insight-line" /></div><div className="insight-card insight-card--mint"><span>ROOM HEALTH</span><strong>99.97%</strong><small>All systems nominal</small><div className="insight-line" /></div><div className="insight-card insight-card--blue"><span>LISTENING TIME</span><strong>18h 42m</strong><small>Across 23 rooms</small><div className="insight-line" /></div></div>}
      {activeNav === 'Recordings' && <div className="recordings-panel">{['Product discovery','Creative direction','Weekly reflection'].map((recording, index) => <button type="button" className="recording-row" key={recording} onClick={() => onNotify(`${recording} recording is opening.`)}><span className="recording-play">▶</span><span><strong>{recording}</strong><small>{index === 0 ? 'Today · 42:18' : index === 1 ? 'Yesterday · 28:04' : 'Sep 30 · 16:22'}</small></span><span className="recording-arrow">↗</span></button>)}</div>}
    </section>
  )
}

export default function App() {
  const [session, setSession] = useState(undefined)
  const [authMode, setAuthMode] = useState('signin')
  const [showAdmin, setShowAdmin] = useState(false)
  const [sessions, setSessions] = useState([])
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [isLive, setIsLive] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(false)
  const [expression, setExpression] = useState('Focused')
  const [voiceMode, setVoiceMode] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [presence, setPresence] = useState(null)
  const [room, setRoom] = useState(null)
  const [health, setHealth] = useState(getConnectionHealth())
  const [remoteStream, setRemoteStream] = useState(null)
  const syncRef = useRef(null)
  const rtcRef = useRef(null)
  const localStreamRef = useRef(null)

  useEffect(() => {
    if (!supabase) { setSession(null); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setAuthMode('reset')
      if (event === 'SIGNED_IN' && authMode !== 'reset') setAuthMode('signin')
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    supabase.from('rooms').select('id,title,status,created_at').order('created_at', { ascending: false }).limit(10).then(({ data }) => {
      if (data) setSessions(data.map(row => ({ name: row.title, guest: 'Private room', time: new Date(row.created_at).toLocaleString(), type: 'Private', color: 'violet', state: row.status })))
    })
  }, [session])

  useEffect(() => {
    if (!room?.id) {
      setRemoteStream(null)
      return undefined
    }
    let active = true
    const sync = createRealtimeSync({ roomId: room.id, onEvent: (event) => {
      if (event.type === 'presence') setPresence(event.value)
      if (['offer', 'answer', 'ice'].includes(event.type)) void rtcRef.current?.handleSignal(event)
      if (event.type === 'peer-joined' && localStreamRef.current) {
        void rtcRef.current?.attachLocalStream(localStreamRef.current)
        void rtcRef.current?.createOffer()
      }
    }})
    const rtc = createWebRTCSession({
      sync,
      onRemoteStream: (stream) => { if (active) setRemoteStream(stream) },
      onStateChange: (state) => { if (state === 'connected') setPresence((value) => value ?? 1) },
    })
    syncRef.current = sync
    rtcRef.current = rtc
    void sync.connect()
    return () => {
      active = false
      rtc.close()
      void sync.disconnect()
      syncRef.current = null
      rtcRef.current = null
      localStreamRef.current = null
      setRemoteStream(null)
    }
  }, [room?.id])

  const dateLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()),
    []
  )

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    setShowAdmin(false)
  }

  const notify = (message = 'Your workspace is up to date.') => {
    setShowToast(message)
    window.setTimeout(() => setShowToast(false), 3200)
  }

  const launchRoom = async () => {
    try {
      const nextRoom = await createRoom({ title: 'Aurora / presence room', avatarId: 'aurora' })
      setRoom(nextRoom)
      setIsLive(true)
      setSessions(current => [{ name: nextRoom.title, guest: 'Private room', time: new Date(nextRoom.createdAt).toLocaleString(), type: 'Private', color: 'violet', state: nextRoom.status }, ...current])
      notify('Your live room was created.')
    } catch (error) { notify(error.message || 'Room creation failed.') }
  }

  const openRoom = () => {
    setActiveNav('Dashboard')
    if (!room) return notify('Create a live room first.')
    window.setTimeout(() => document.querySelector('.stream-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }

  const navClick = (label) => {
    setActiveNav(label)
  }

  if (session === undefined) return <main className="auth-screen"><div className="auth-card"><span className="auth-kicker">SPECTRA STUDIO</span><h1>Securing your workspace…</h1></div></main>
  if (!session || authMode === 'reset') return <AuthScreen initialMode={authMode} onAuthenticated={(nextSession) => {
    setAuthMode('signin')
    setSession(nextSession)
  }} />
  if (showAdmin && isAdminUser(session.user)) return <AdminDashboard user={session.user} onClose={() => setShowAdmin(false)} onSignOut={signOut} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><span className="brand-mark"><i /><i /><i /></span><span>spectra<span className="brand-dot">.</span></span></div>
        <div className="workspace-switcher"><div className="workspace-avatar">A</div><div><b>Arc / Studio</b><span>Personal workspace</span></div><span className="chevron">⌄</span></div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {navItems.map((item) => <button type="button" key={item.label} className={`nav-item ${activeNav === item.label ? 'is-active' : ''}`} onClick={() => navClick(item.label)}><Icon>{item.icon}</Icon><span>{item.label}</span>{item.count && <em className="nav-count">{item.count}</em>}</button>)}
        </nav>
        <div className="sidebar-rule" />
        <nav className="primary-nav" aria-label="Tools navigation">
          <span className="nav-label">Studio</span>
          <button type="button" className="nav-item" onClick={() => setShowInvite(true)}><Icon>＋</Icon><span>Invite someone</span></button>
          <button type="button" className="nav-item" onClick={() => setActiveNav('Profile')}><Icon>◎</Icon><span>Profile</span></button>
          <button type="button" className="nav-item" onClick={() => setActiveNav('Settings')}><Icon>⚙</Icon><span>Settings</span></button>
          <button type="button" className="nav-item" onClick={() => setActiveNav('Security')}><Icon>◈</Icon><span>Security</span></button>
          <button type="button" className="nav-item" onClick={() => setActiveNav('Billing')}><Icon>◇</Icon><span>Billing</span></button>
        </nav>
        <div className="sidebar-bottom"><div className="upgrade-card"><span className="upgrade-tag">PHOENIX / NEW</span><strong>Presence, amplified.</strong><span>Shape the tone of every room with Aurora.</span><button type="button" onClick={launchRoom}>Open live room <span>→</span></button></div><div className="account-row account-row--menu">
          <button type="button" className="account-identity" onClick={() => setShowAccountMenu(v => !v)} aria-expanded={showAccountMenu}>
            <div className="profile-avatar">AS</div>
            <div><strong>{session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Account'}</strong><span>{isAdminUser(session.user) ? 'Administrator' : 'Workspace member'}</span></div>
          </button>
          <button type="button" className="account-menu-trigger" aria-label="Account menu" onClick={() => setShowAccountMenu(v => !v)}>•••</button>
          {showAccountMenu && <div className="account-menu">
            <div className="account-menu-email">{session.user.email}</div>
            {isAdminUser(session.user) && <button type="button" onClick={() => { setShowAccountMenu(false); setShowAdmin(true) }}>⚙ Admin Dashboard</button>}
            <button type="button" onClick={() => { setShowAccountMenu(false); signOut() }}>↪ Sign out</button>
          </div>}
        </div></div>
      </aside>

      <main className="main-canvas">
        <header className="topbar"><div className="mobile-brand"><span className="brand-mark"><i /><i /><i /></span></div><div className="search-box"><span>⌕</span><input aria-label="Search" placeholder="Search rooms, guests, media, or generations..." onFocus={() => setActiveNav("Search")} onKeyDown={(event) => { if (event.key === "Enter") setActiveNav("Search") }} /></div><div className="top-actions"><span className="date-readout">{dateLabel}</span><button type="button" className="icon-button notification-button" aria-label="Notifications" onClick={() => setActiveNav("Notifications")}>♧<i /></button><button type="button" className="language-button"><span className="globe">◎</span> EN <span>⌄</span></button><div className="top-account-wrap"><div className="top-profile top-profile--clickable" role="button" tabIndex="0" onClick={() => setShowAccountMenu(v => !v)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setShowAccountMenu(v => !v) }}><div className="profile-avatar">AS</div><div><span>Good morning</span><strong>{session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Account'}</strong></div><span className="chevron">⌄</span></div>{showAccountMenu && <div className="top-account-menu"><span>{session.user.email}</span><button type="button" onClick={() => { setShowAccountMenu(false); setActiveNav('Profile') }}>Profile</button><button type="button" onClick={() => { setShowAccountMenu(false); setActiveNav('Settings') }}>Settings</button><button type="button" onClick={() => { setShowAccountMenu(false); signOut() }}>Sign out</button></div>}</div></div></header>

        <div className={`page-content ${activeNav !== 'Dashboard' ? 'page-content--inner-view' : ''}`}>
          {activeNav === 'Identity Lab' && <IdentityLab user={session.user} onBack={() => setActiveNav('Dashboard')} onNotify={notify} />}
          {['Create','Communicate','Library'].includes(activeNav) && <StudioHub section={activeNav} user={session.user} onBack={() => setActiveNav('Dashboard')} onNotify={notify} />}
          {['Profile','Settings'].includes(activeNav) && <AccountCenter mode={activeNav} user={session.user} onBack={() => setActiveNav('Dashboard')} onNotify={notify} />}
          {['Search','Notifications','Billing','Security'].includes(activeNav) && <PlatformCenter mode={activeNav} user={session.user} onBack={() => setActiveNav('Dashboard')} onNotify={notify} />}
          {['Live rooms','People','Insights','Recordings'].includes(activeNav) && <WorkspacePanel activeNav={activeNav} sessions={sessions} onLaunch={launchRoom} onInvite={() => setShowInvite(true)} onBack={() => setActiveNav('Dashboard')} onNotify={notify} />}
          {activeNav === 'Dashboard' && <>
          <section className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-line" /> WELCOME BACK, GOOD MORNING <span className="sunmark">✦</span></div><h1>Your presence, <em>in focus.</em></h1><p>Design better conversations with a little more room to be human.</p></div><div className="status-summary"><span className="status-pulse" /> All systems operational <span className="status-divider" /> Phoenix v1.4</div></section>

          <section className="hero-room">
            <div className="hero-copy"><div className="hero-copy-kicker"><span className="sparkle-icon">✦</span> A NEW KIND OF VIDEO ROOM</div><h2>Make every<br />conversation feel <span>closer.</span></h2><p>Meet Aurora, your realtime AI presence designed to listen, reflect, and move the conversation forward.</p><div className="hero-actions"><button type="button" className="primary-button" onClick={launchRoom}>{isLive ? 'Open live room' : 'Launch live room'} <span>↗</span></button><button type="button" className="ghost-button" onClick={() => setShowInvite(true)}>Invite a guest <span>＋</span></button></div><div className="hero-meta"><span><i className="meta-icon">◉</i> Phoenix engine</span><span><i className="meta-icon">⌁</i> Multimodal</span><span><i className="meta-icon">◌</i> Private by default</span></div></div>
            <div className="hero-visual"><div className="visual-glow" /><div className="visual-grid" /><div className="visual-label visual-label--top"><span className="live-dot" /> LIVE ROOM / 001 <span>4K · 60 FPS</span></div><AvatarRenderer name="Aurora" mood={expression.toLowerCase()} /><div className="orbit orbit--one" /><div className="orbit orbit--two" /><div className="hero-status-card"><div className="hero-status-heading"><span>Presence quality</span><span>LIVE</span></div><div className="quality-row"><strong>{presence == null ? '—' : `${presence}%`}</strong><div className="quality-meter"><i style={{ width: `${presence}%` }} /></div></div><span>Listening with intention</span></div><div className="visual-label visual-label--bottom"><span className="wave-mini"><i /><i /><i /><i /><i /></span> Encrypted · Low latency</div></div>
          </section>

          <section className="metrics-grid"><MetricCard label="Live rooms" value={String(sessions.length).padStart(2, "0")} detail="From your workspace" tone="purple"><SparkBars color="purple" /></MetricCard><MetricCard label="Avg. presence" value={presence == null ? '—' : `${presence} active`} detail="+4.2% vs last week" tone="mint"><SparkBars color="mint" /></MetricCard><MetricCard label="Stream health" value="—" detail={health.latencyMs == null ? health.status : `${health.latencyMs}ms latency · ${health.packetLoss}% loss`} tone="blue"><div className="health-ring"><span>GOOD</span></div></MetricCard><div className="quick-launch"><span className="quick-kicker">QUICK LAUNCH</span><strong>Start a new<br /><em>conversation.</em></strong><button type="button" onClick={launchRoom}>Open live room <span>↗</span></button><span className="quick-orb" /></div></section>

          <div className="dashboard-split"><VideoStream cameraEnabled={cameraEnabled} onCameraToggle={setCameraEnabled} onLocalStream={(stream) => { localStreamRef.current = stream; if (stream) { void rtcRef.current?.attachLocalStream(stream); void rtcRef.current?.createOffer() } else { rtcRef.current?.close() } }} remoteStream={remoteStream} onOpenRoom={openRoom} /><aside className="signal-side"><div className="signal-side-heading"><div><div className="section-kicker"><span className="section-index">02</span><span>Signal monitor</span></div><h3>Everything<br /><em>in sync.</em></h3></div><SignalPill>Live</SignalPill></div><div className="signal-summary"><div className="signal-summary-top"><span>CONNECTION QUALITY</span><strong>{health.status.toUpperCase()}</strong></div><div className="signal-waveform">{[30, 56, 43, 75, 48, 91, 57, 35, 65, 85, 47, 72, 37, 59, 81, 44, 63, 31, 55, 77].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div><div className="signal-time"><span>00:12:42</span><span>{health.latencyMs}ms latency</span></div></div><div className="conversation-card"><div className="conversation-top"><span>Latest exchange</span><button type="button" onClick={() => notify('Transcript is ready to review.')}>View transcript ↗</button></div><div className="quote-mark">“</div><p>We could make the first moment feel less like an introduction, and more like an <em>arrival.</em></p><div className="transcript-by"><span className="mini-avatar">AS</span><span>Adrian · just now</span><span className="confidence">98% clear</span></div></div><div className="signal-footer"><span><span className="secure-icon">✦</span> End-to-end encrypted</span><button type="button" onClick={() => setVoiceMode(!voiceMode)} className={`voice-toggle ${voiceMode ? 'is-on' : ''}`}><span>{voiceMode ? 'Voice mode' : 'Text mode'}</span><i /></button></div></aside></div>

          <section className="bottom-grid"><div className="sessions-card"><div className="card-heading"><div><div className="section-kicker"><span className="section-index">03</span><span>Upcoming</span></div><h3>Your rooms</h3></div><button type="button" className="view-all" onClick={() => navClick('Live rooms')}>View all <span>↗</span></button></div><div className="session-list">{sessions.map((session) => <div className="session-row" key={session.name}><div className={`session-avatar session-avatar--${session.color}`}>{session.guest.split(' ').map(n => n[0]).join('')}</div><div className="session-main"><strong>{session.name}</strong><span>{session.guest} <i /> {session.time}</span></div><span className={`session-type session-type--${session.type === 'AI room' ? 'ai' : 'private'}`}>{session.type}</span><span className={`session-state session-state--${session.state.toLowerCase()}`}><i /> {session.state}</span><button type="button" className="row-more" aria-label={`More options for ${session.name}`}>•••</button></div>)}</div></div><div className="activity-card"><div className="card-heading"><div><div className="section-kicker"><span className="section-index">04</span><span>Pulse</span></div><h3>Recent activity</h3></div><button type="button" className="more-button" aria-label="More activity options">•••</button></div><div className="activity-list"><Activity icon="↗" title="Room exported" text="Creative direction" time="12m" tone="violet" /><Activity icon="✦" title="Phoenix updated" text="New presence model" time="1h" tone="lime" /><Activity icon="◉" title="New room created" text="Product discovery" time="3h" tone="blue" /></div></div></section>
          </>}
        </div>
        <footer className="page-footer"><span>SPECTRA / A PLACE FOR PRESENCE</span><span>Build 1.4.0 <i /> Lagos, NG</span></footer>
      </main>

      {showInvite && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowInvite(false)}><div className="invite-modal"><button className="modal-close" type="button" onClick={() => setShowInvite(false)}>×</button><div className="modal-orb"><span>＋</span></div><div className="eyebrow"><span className="eyebrow-line" /> ADD A HUMAN</div><h2>Bring someone<br /><em>into the room.</em></h2><p>Share a private link. They can join from any browser, no account required.</p><label className="input-label">Guest email or name<input type="text" placeholder="someone@studio.com" autoFocus /></label><button type="button" className="primary-button modal-submit" onClick={() => { setShowInvite(false); notify('Your invite link is ready.') }}>Create invite link <span>↗</span></button><span className="modal-footnote">The room stays private until you share the link.</span></div></div>}
      {showToast && <div className="toast"><span className="toast-check">✓</span><div><strong>{typeof showToast === 'string' ? showToast : 'Your workspace is ready.'}</strong><span>{isLive ? `Room ${room?.id ?? 'live'} · encrypted connection` : 'This view is connected to your workspace.'}</span></div><button type="button" onClick={() => setShowToast(false)}>×</button></div>}
    </div>
  )
}
