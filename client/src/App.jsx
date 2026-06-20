import { useEffect, useState } from 'react'

const MS_25_MIN = 25 * 60 * 1000
const AUTH_URL = 'https://api.simonegentili.com/quadrato/authenticate'
const DATA_URL = 'https://api.simonegentili.com/quadrato/data'
const WORKSPACES_URL = 'https://api.simonegentili.com/quadrato/workspaces'
const SET_WORKSPACE_URL = 'https://api.simonegentili.com/quadrato/workspace/current'
const TOKEN_KEY = 'quadrato_token'

function groupByDay(timeboxes) {
  const groups = {}
  for (const p of timeboxes) {
    const d = new Date(p.started_at)
    const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    if (!groups[day]) groups[day] = []
    groups[day].push(p)
  }
  return groups
}

function formatTime(iso) {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function pad(n) {
  return String(n).padStart(2, '0')
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
      if (!res.ok) { setError('Credenziali non valide'); setLoading(false); return }
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
          background: '#fff', borderRadius: 8, padding: '2rem', minWidth: 320,
          boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '1.25rem' }}>Accedi</h2>
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
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? 'Accesso…' : 'Accedi'}
          </button>
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
          background: '#fff', borderRadius: 8, padding: '1.5rem',
          width: '90%', maxWidth: 540, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <input
          autoFocus
          type="text"
          placeholder="Cerca task…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem', marginBottom: '1rem', borderRadius: 4, border: '1px solid #ccc' }}
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
              <button
                onClick={() => { onStart(taskLabel(task)); onClose() }}
                disabled={!canStart}
                style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem', marginLeft: '1rem', cursor: canStart ? 'pointer' : 'default' }}
              >
                START
              </button>
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
        headers: { 'Content-Type': 'application/json', Authorization: token },
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
          background: '#fff', borderRadius: 8, padding: '1.5rem',
          width: '90%', maxWidth: 560, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Workspace</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <input
          autoFocus
          type="text"
          placeholder="Cerca workspace…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.5rem', fontSize: '1rem', marginBottom: '1rem', borderRadius: 4, border: '1px solid #ccc' }}
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
                {ws.current && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#666' }}>(corrente)</span>}
                <div style={{ fontSize: '0.78rem', color: '#888', marginTop: 2 }}>
                  {ws.tasks_count} task
                  {ws.tasks_expired > 0 && <span style={{ color: '#c00', marginLeft: 6 }}>{ws.tasks_expired} scadut{ws.tasks_expired === 1 ? 'o' : 'i'}</span>}
                </div>
              </div>
              <button
                onClick={() => handleSelect(ws.name)}
                disabled={ws.current || loading !== null}
                style={{
                  fontSize: '0.85rem', padding: '0.25rem 0.75rem', marginLeft: '1rem',
                  cursor: ws.current || loading !== null ? 'default' : 'pointer',
                  opacity: ws.current ? 0.4 : 1,
                }}
              >
                {loading === ws.name ? '…' : 'Seleziona'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function App() {
  const [timeboxes, setTimeboxes] = useState([])
  const [now, setNow] = useState(Date.now())
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [showTasks, setShowTasks] = useState(false)
  const [showWorkspaces, setShowWorkspaces] = useState(false)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [tasks, setTasks] = useState([])
  const [workspaces, setWorkspaces] = useState([])

  const fetchTasks = async (tok) => {
    try {
      const res = await fetch(DATA_URL, { headers: { Authorization: tok } })
      if (!res.ok) return
      const data = await res.json()
      setTasks((data['simplanner-tasks'] ?? []).filter((t) => !t.archived))
    } catch {
      // silently fail — tasks are optional
    }
  }

  const fetchWorkspaces = async (tok) => {
    try {
      const res = await fetch(WORKSPACES_URL, { headers: { Authorization: tok } })
      if (!res.ok) return
      const data = await res.json()
      setWorkspaces(data.workspaces ?? [])
    } catch {
      // silently fail
    }
  }

  const load = () =>
    fetch('https://api.simonegentili.com/tome/timeboxes')
      .then((r) => r.json())
      .then(setTimeboxes)

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (token) {
      fetchTasks(token)
      fetchWorkspaces(token)
    }
  }, [token])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const last = timeboxes[0]

  const elapsed = last ? now - new Date(last.started_at).getTime() : Infinity
  const canStart = elapsed >= MS_25_MIN
  const remaining = canStart ? 0 : Math.ceil((MS_25_MIN - elapsed) / 1000)
  const countdown = `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`

  console.log({ canStart })

  const start = async (description = '') => {
    await fetch('https://api.simonegentili.com/tome/timeboxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    })
    load()
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setEditValue(p.description ?? '')
  }

  const saveEdit = async (id) => {
    await fetch(`https://api.simonegentili.com/tome/timeboxes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editValue }),
    })
    setEditingId(null)
    load()
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

  const groups = groupByDay(timeboxes)

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0 }}>Tracker</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {token && workspaces.length > 0 && (
            <button
              onClick={() => setShowWorkspaces(true)}
              style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}
            >
              {workspaces.find((w) => w.current)?.name ?? 'Workspace'}
            </button>
          )}
          {token && tasks.length > 0 && (
            <button
              onClick={() => setShowTasks(true)}
              style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}
            >
              Task ({tasks.length})
            </button>
          )}
          {token ? (
            <button onClick={handleLogout} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
              Logout
            </button>
          ) : (
            <button onClick={() => setShowLogin(true)} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
              Login
            </button>
          )}
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
          onSwitch={() => { fetchWorkspaces(token); fetchTasks(token) }}
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

      <div style={{ marginTop: '1.5rem' }}>
        <button onClick={() => start()} disabled={!canStart} style={{ fontSize: '1rem', padding: '0.5rem 1.5rem' }}>
          {canStart ? 'Start Timebox' : `Wait ${countdown}`}
        </button>
      </div>

      {Object.entries(groups).map(([day, items]) => (
        <section key={day} style={{ marginTop: '2rem' }}>
          <h2>{day} — {items.length} timebox{items.length === 1 ? '' : 'es'}</h2>
          <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
            {items.map((p) => (
              <li
                key={p.id}
                onDoubleClick={() => startEdit(p)}
                style={{ cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: 4 }}
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
                  <>{formatTime(p.started_at)}{p.description ? ` — ${p.description}` : ''}</>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}