import { SGFooter, Authenticator, Button } from '@sensorario/sg-components'
import { useEffect, useState } from 'react'

const MS_25_MIN = 25 * 60 * 1000
const AUTH_URL = 'https://api.simonegentili.com/quadrato/authenticate'
const DATA_URL = 'https://api.simonegentili.com/quadrato/data'
const WORKSPACES_URL = 'https://api.simonegentili.com/quadrato/workspaces'
const SET_WORKSPACE_URL = 'https://api.simonegentili.com/quadrato/workspace/current'
const TOKEN_KEY = 'quadrato_token'
const APP_VERSION = __APP_VERSION__

function parseUTC(iso) {
  if (iso && !iso.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(iso)) {
    return new Date(iso + 'Z')
  }
  return new Date(iso)
}

function groupByDay(timeboxes) {
  const groups = {}
  for (const p of timeboxes) {
    const d = parseUTC(p.started_at)
    const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    if (!groups[day]) groups[day] = []
    groups[day].push(p)
  }
  return groups
}

function formatTime(iso) {
  const d = parseUTC(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pad(n) {
  return String(n).padStart(2, '0')
}

const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']

function dayOfWeek(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number)
  return DAYS_IT[new Date(y, m - 1, d).getDay()]
}

function Tomato() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="10" cy="12" rx="7.5" ry="6.5" fill="#e53e3e" />
      <path d="M10 5.5 C10 5.5 9 3 7 3 C7 5 8.5 5.5 10 5.5Z" fill="#38a169" />
      <path d="M10 5.5 C10 5.5 11 3 13 3 C13 5 11.5 5.5 10 5.5Z" fill="#48bb78" />
      <path d="M10 5.5 L10 7.5" stroke="#38a169" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="7.5" cy="10.5" rx="1.5" ry="2" fill="#fc8181" opacity="0.5" />
    </svg>
  )
}

function DayRow({ day, items, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flexWrap: 'wrap' }}
    >
      <span style={{ fontSize: '0.95rem', color: '#666', minWidth: 115 }}>
        <span style={{ background: '#f0f0f0', padding: '0.2rem 0.5rem', borderRadius: 8, fontWeight: 600, color: '#444', width: 50, display: 'inline-block', textAlign: 'center' }}>{dayOfWeek(day)}</span>{' '}
        <span style={{ background: '#f0f0f0', padding: '0.2rem 0.5rem', borderRadius: 8 }}>{day}</span>
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', flex: '1 1 auto', minWidth: 0 }}>
        {items.map((_, i) => <Tomato key={i} />)}
      </div>
    </div>
  )
}

function taskLabel(task) {
  if (typeof task === 'string') return task
  return task.name ?? task.title ?? task.description ?? JSON.stringify(task)
}

function LoginModal({ onClose, onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) {
        setError('Credenziali non valide');
        setLoading(false);
        return
      }
      const { token } = await res.json()
      onSuccess(token)
    } catch {
      setError('Errore di rete')
    }
    setLoading(false)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 8, padding: 'clamp(1.25rem, 5vw, 2rem)',
          width: '90%', maxWidth: 320, boxSizing: 'border-box',
          boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        }}
      >
        <h2 style={{ marginTop: 2, marginBottom: '2rem' }}>Accedi</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>Username</label>
            <input
              autoFocus
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', fontSize: '1rem', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.45rem', fontSize: '1rem', boxSizing: 'border-box' }}
              required
            />
          </div>
          {error && <p style={{ color: 'red', margin: '0 0 1rem' }}>{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            label={loading ? 'Accesso…' : 'Accedi'}
            style={{
              width: '100%',
              padding: '0.6rem',
              fontSize: '1rem',
              cursor: loading ? 'default' : 'pointer'
            }}
          />
        </form>
      </div>
    </div>
  )
}

function TaskModal({ tasks, canStart, onStart, onClose }) {
  const [search, setSearch] = useState('')

  const filtered = tasks.filter((t) =>
    taskLabel(t).toLowerCase().includes(search.toLowerCase())
  )

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      onClick={onClose}
      onKeyDown={handleKey}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 8, padding: 'clamp(1rem, 5vw, 1.5rem)',
          width: '90%', maxWidth: 540, maxHeight: '80vh', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h2 style={{ margin: 0 }}>Task</h2>
          <Button onClick={onClose} label="×" style={{
            background: 'none',
            border: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            lineHeight: 1
          }} />
        </div>
        <input
          autoFocus
          type="text"
          placeholder="Cerca task…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            marginBottom: '1rem',
            borderRadius: 4,
            border: '1px solid #ccc'
          }}
        />
        <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 && (
            <li style={{ color: '#999', padding: '0.5rem 0' }}>Nessun task trovato</li>
          )}
          {filtered.map((task, i) => (
            <li
              key={i}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.4rem 0.5rem', borderBottom: '1px solid #eee',
              }}
            >
              <span>{taskLabel(task)}</span>
              <Button
                onClick={() => {
                  onStart(taskLabel(task));
                  onClose()
                }}
                disabled={!canStart}
                label="START"
                style={{
                  fontSize: '0.85rem',
                  padding: '0.25rem 0.75rem',
                  marginLeft: '1rem',
                  cursor: canStart ? 'pointer' : 'default'
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function WorkspaceModal({ workspaces, token, onClose, onSwitch }) {
  const [loading, setLoading] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleKey = (e) => {
    if (e.key === 'Escape') onClose()
  }

  const handleSelect = async (name) => {
    setLoading(name)
    try {
      await fetch(SET_WORKSPACE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      })
      onSwitch()
    } finally {
      setLoading(null)
      onClose()
    }
  }

  return (
    <div
      onClick={onClose}
      onKeyDown={handleKey}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 8, padding: 'clamp(1rem, 5vw, 1.5rem)',
          width: '90%', maxWidth: 560, maxHeight: '80vh', boxSizing: 'border-box',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <h2 style={{ margin: 0 }}>Workspace</h2>
          <Button onClick={onClose} label="×" style={{
            background: 'none',
            border: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            lineHeight: 1
          }} />
        </div>
        <input
          autoFocus
          type="text"
          placeholder="Cerca workspace…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '0.5rem',
            fontSize: '1rem',
            marginBottom: '1rem',
            borderRadius: 4,
            border: '1px solid #ccc'
          }}
        />
        <ul style={{ paddingLeft: 0, listStyle: 'none', margin: 0, overflowY: 'auto', flex: 1 }}>
          {filtered.length === 0 && (
            <li style={{ color: '#999', padding: '0.5rem 0' }}>Nessun workspace trovato</li>
          )}
          {filtered.map((ws) => (
            <li
              key={ws.id ?? ws.name}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.5rem 0.5rem', borderBottom: '1px solid #eee',
                background: ws.current ? '#f0f8ff' : 'transparent',
              }}
            >
              <div>
                <span style={{ fontWeight: ws.current ? 700 : 400 }}>{ws.name}</span>
                {ws.current &&
                  <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#666' }}>(corrente)</span>}
                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>
                  {ws.tasks_count} task
                  {ws.tasks_expired > 0 && <span style={{
                    color: '#c00', marginLeft: 6
                  }}>{ws.tasks_expired} scadut{ws.tasks_expired === 1 ? 'o' : 'i'}</span>}
                </div>
              </div>
              <Button
                onClick={() => handleSelect(ws.name)}
                disabled={ws.current || loading !== null}
                label={loading === ws.name ? '…' : 'Seleziona'}
                style={{
                  fontSize: '0.85rem', padding: '0.25rem 0.75rem', marginLeft: '1rem',
                  cursor: ws.current || loading !== null ? 'default' : 'pointer',
                  opacity: ws.current ? 0.4 : 1,
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function todayKeyInit() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function App() {
  const [timeboxes, setTimeboxes] = useState([])
  const [now, setNow] = useState(Date.now())
  const [route, setRoute] = useState('/')
  const [activeTab, setActiveTab] = useState('oggi')
  const [editingId, setEditingId] = useState(null)
  const [dateFrom, setDateFrom] = useState(todayKeyInit)
  const [dateTo, setDateTo] = useState(todayKeyInit)
  const [editValue, setEditValue] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showWorkspaces, setShowWorkspaces] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [tasks, setTasks] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [startError, setStartError] = useState(null)

  const fetchTasks = async (tok) => {
    try {
      const res = await fetch(DATA_URL, { headers: { Authorization: `Bearer ${tok}` } })
      if (!res.ok) return
      const data = await res.json()
      setTasks((data['simplanner-tasks'] ?? []).filter((t) => !t.archived))
    } catch {
      // silently fail — tasks are optional
    }
  }

  const fetchWorkspaces = async (tok) => {
    try {
      const res = await fetch(WORKSPACES_URL, { headers: { Authorization: `Bearer ${tok}` } })
      if (!res.ok) return
      const data = await res.json()
      setWorkspaces(data.workspaces ?? [])
    } catch {
      // silently fail
    }
  }

  const load = async (tok) => {
    if (!tok) return
    try {
      const res = await fetch('https://api.simonegentili.com/tome/timeboxes', {
        headers: { Authorization: `Bearer ${tok}` },
      })
      if (res.status === 401) {
        handleLogout()
        setShowLogin(true)
        return
      }
      if (!res.ok) return
      const data = await res.json()
      setTimeboxes(Array.isArray(data) ? data : [])
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    if (token) {
      load(token)
      fetchTasks(token)
      fetchWorkspaces(token)
    }
  }, [token])

  useEffect(() => {
    if (route !== '/') {
      setDateFrom(route)
      setDateTo(route)
    }
  }, [route])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const last = timeboxes[0]

  const elapsed = last ? now - parseUTC(last.started_at).getTime() : Infinity
  const canStart = elapsed >= MS_25_MIN
  const remaining = canStart ? 0 : Math.ceil((MS_25_MIN - elapsed) / 1000)
  const countdown = `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`

  const start = async (description = '') => {
    try {
      const res = await fetch('https://api.simonegentili.com/tome/timeboxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ description }),
      })
      if (res.status === 401) {
        handleLogout()
        setShowLogin(true)
        return
      }
      if (!res.ok) {
        setStartError('Impossibile avviare il timebox. Riprova.')
        return
      }
      setStartError(null)
      load(token)
    } catch {
      setStartError('Impossibile avviare il timebox. Riprova.')
    }
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setEditValue(p.description ?? '')
  }

  const saveEdit = async (id) => {
    await fetch(`https://api.simonegentili.com/tome/timeboxes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ description: editValue }),
    })
    setEditingId(null)
    load(token)
  }

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') saveEdit(id)
    if (e.key === 'Escape') setEditingId(null)
  }

  const handleLoginSuccess = (tok) => {
    localStorage.setItem(TOKEN_KEY, tok)
    setToken(tok)
    setShowLogin(false)
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setTasks([])
    setWorkspaces([])
  }

  const groups = token ? groupByDay(timeboxes) : {}
  const todayKey = todayKeyInit()
  if (token && !(todayKey in groups)) groups[todayKey] = []

  const repeatableIds = new Set(
    Object.values(
      (groups[todayKey] ?? []).reduce((acc, p) => {
        const key = p.description ?? ''
        if (!acc[key] || parseUTC(p.started_at) > parseUTC(acc[key].started_at)) {
          acc[key] = p
        }
        return acc
      }, {})
    ).map((p) => p.id)
  )

  const filteredItems = route !== '/'
    ? Object.entries(groups)
      .filter(([day]) => day >= dateFrom && day <= dateTo)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .flatMap(([day, items]) => items.map((p) => ({ ...p, _day: day })))
    : []

  return (
    <>
      <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(1.25rem, 5vw, 1.75rem)' }}>Time Tracker</h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {token && workspaces.length > 0 && (
              <Button
                onClick={() => setShowWorkspaces(true)}
                label={workspaces.find((w) => w.current)?.name ?? 'Workspace'}
                style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}
              />
            )}
            {token && tasks.length > 0 && (
              <Button
                onClick={() => setShowTasks(true)}
                label={`Task (${tasks.length})`}
                style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}
              />
            )}
            <Authenticator
              isLoggedIn={!!token}
              handleLogin={() => setShowLogin(true)}
              handleLogout={handleLogout}
            />
          </div>
        </div>

        {showLogin && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            onSuccess={handleLoginSuccess}
          />
        )}

        {showWorkspaces && (
          <WorkspaceModal
            workspaces={workspaces}
            token={token}
            onClose={() => setShowWorkspaces(false)}
            onSwitch={() => {
              fetchWorkspaces(token);
              fetchTasks(token)
            }}
          />
        )}

        {showTasks && (
          <TaskModal
            tasks={tasks}
            canStart={canStart}
            onStart={start}
            onClose={() => setShowTasks(false)}
          />
        )}

        {!token && (
          <p style={{ marginTop: '1.5rem', color: '#666', textAlign: 'center' }}>
            Accedi per visualizzare i timebox e iniziare a tracciarli.
          </p>
        )}

        {token && route !== '/' ? (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <Button
                onClick={() => setRoute('/')}
                label="← Indietro"
                style={{ fontSize: '0.9rem', cursor: 'pointer' }}
              />
              <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Dal
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  style={{ fontSize: '1rem', padding: '0.2rem 0.4rem', borderRadius: 4, border: '1px solid #ccc' }}
                />
              </label>
              <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                Al
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  style={{ fontSize: '1rem', padding: '0.2rem 0.4rem', borderRadius: 4, border: '1px solid #ccc' }}
                />
              </label>
            </div>
            <h2 style={{ marginBottom: '1rem' }}>
              {filteredItems.length} timebox{filteredItems.length === 1 ? '' : 'es'}
            </h2>
            <ul style={{ paddingLeft: 0, listStyle: 'none', marginBottom: '1rem' }}>
              {filteredItems.map((p) => (
                <li
                  key={p.id}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderLeft: '3px solid transparent',
                    borderRadius: 4,
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: '#999', marginRight: '0.5rem' }}>{p._day}</span>
                  {formatTime(p.started_at)}{p.description ? ` — ${p.description}` : ''}
                </li>
              ))}
              {filteredItems.length === 0 && (
                <li style={{ color: '#999', padding: '0.5rem 0' }}>Nessun timebox nel periodo selezionato</li>
              )}
            </ul>
          </div>
        ) : token && (
          <>
            <div style={{ display: 'flex', gap: 0, marginTop: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
              {['oggi', 'storico'].map((tab) => (
                <Button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  label={tab}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2px solid #f59e0b' : '2px solid transparent',
                    marginBottom: -2,
                    padding: '0.5rem 1.25rem',
                    fontSize: '0.95rem',
                    fontWeight: activeTab === tab ? 700 : 400,
                    color: activeTab === tab ? '#b45309' : '#666',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                />
              ))}
            </div>

            {activeTab === 'oggi' && (
              <>
                <div style={{ marginTop: '1.5rem' }}>
                  {startError && (
                    <p style={{ color: 'red', margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{startError}</p>
                  )}
                  {canStart ? (
                    <Button
                      onClick={() => start()}
                      label="Start Timebox"
                      style={{ fontSize: '1rem', padding: '0.5rem 1.5rem', width: '100%' }}
                    />
                  ) : (
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.35rem',
                        fontSize: '0.85rem',
                        color: '#666'
                      }}>
                        <span>Prossimo timebox disponibile</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
                      </div>
                      <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${Math.min((elapsed / MS_25_MIN) * 100, 100)}%`,
                          background: '#f59e0b',
                          borderRadius: 4,
                          transition: 'width 1s linear',
                        }} />
                      </div>
                    </div>
                  )}
                </div>
                <section style={{ marginTop: '1.5rem' }}>
                  <h2 style={{ marginBottom: '1rem' }}>
                    {todayKey} — {(groups[todayKey] ?? []).length} timebox{(groups[todayKey] ?? []).length === 1 ? '' : 'es'}
                  </h2>
                  <ul style={{ paddingLeft: 0, listStyle: 'none', marginBottom: '1rem' }}>
                    {(groups[todayKey] ?? []).map((p) => (
                      <li
                        key={p.id}
                        onDoubleClick={() => startEdit(p)}
                        style={{
                          cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: 4,
                          ...(last && p.id === last.id ? {
                            background: '#fffbea',
                            borderLeft: '3px solid #f59e0b',
                            paddingLeft: '0.75rem',
                            fontWeight: 600,
                          } : { borderLeft: '3px solid transparent', paddingLeft: '0.75rem' }),
                        }}
                      >
                        {editingId === p.id ? (
                          <>
                            <span style={{ marginRight: '0.5rem' }}>{formatTime(p.started_at)} —</span>
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, p.id)}
                              onBlur={() => setEditingId(null)}
                              style={{ fontSize: 'inherit', width: '60%' }}
                            />
                          </>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span>{formatTime(p.started_at)}{p.description ? ` — ${p.description}` : ''}</span>
                            {canStart && repeatableIds.has(p.id) && (
                              <Button
                                onClick={(e) => { e.stopPropagation(); start(p.description ?? '') }}
                                title="Ripeti questo task"
                                label="↺"
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  fontSize: '1rem', padding: '0 0.25rem', color: '#999', lineHeight: 1,
                                }}
                              />
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {activeTab === 'storico' && (
              <div style={{ marginTop: '1.5rem' }}>
                {Object.entries(groups)
                  .filter(([day]) => day !== todayKey)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([day, items]) => (
                    <section key={day} style={{ marginTop: '8px' }}>
                      <DayRow
                        day={day}
                        items={items}
                        onClick={() => { setRoute(day); setDateFrom(day); setDateTo(day) }}
                      />
                    </section>
                  ))}
              </div>
            )}
          </>
        )}

        <div style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '16px' }}>
          <strong>Versione:</strong> v{APP_VERSION}
        </div>
      </div>
      <SGFooter />
    </>
  )
}