import { useEffect, useState } from 'react'

const MS_25_MIN = 25 * 60 * 1000

function groupByDay(pomodoros) {
  const groups = {}
  for (const p of pomodoros) {
    const day = p.started_at.slice(0, 10)
    if (!groups[day]) groups[day] = []
    groups[day].push(p)
  }
  return groups
}

function formatTime(iso) {
  return iso.slice(11, 16)
}

function pad(n) {
  return String(n).padStart(2, '0')
}

export default function App() {
  const [pomodoros, setPomodoros] = useState([])
  const [now, setNow] = useState(Date.now())
  const [editingId, setEditingId] = useState(null)
  const [editValue, setEditValue] = useState('')

  const load = () =>
    fetch('/api/pomodoros')
      .then((r) => r.json())
      .then(setPomodoros)

  useEffect(() => { load() }, [])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const last = pomodoros[0]
  const elapsed = last ? now - new Date(last.started_at).getTime() : Infinity
  const canStart = elapsed >= MS_25_MIN
  const remaining = canStart ? 0 : Math.ceil((MS_25_MIN - elapsed) / 1000)
  const countdown = `${pad(Math.floor(remaining / 60))}:${pad(remaining % 60)}`

  const start = async () => {
    await fetch('/api/pomodoros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: '' }),
    })
    load()
  }

  const startEdit = (p) => {
    setEditingId(p.id)
    setEditValue(p.description ?? '')
  }

  const saveEdit = async (id) => {
    await fetch(`/api/pomodoros/${id}`, {
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

  const groups = groupByDay(pomodoros)

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Tracker</h1>
      <button onClick={start} disabled={!canStart} style={{ fontSize: '1rem', padding: '0.5rem 1.5rem' }}>
        {canStart ? 'Start Pomodoro' : `Wait ${countdown}`}
      </button>

      {Object.entries(groups).map(([day, items]) => (
        <section key={day} style={{ marginTop: '2rem' }}>
          <h2>{day} — {items.length} pomodor{items.length === 1 ? 'o' : 'i'}</h2>
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