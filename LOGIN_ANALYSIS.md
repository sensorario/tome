# Analisi del flusso di login — Bug "Uncaught TypeError: e is not iterable"

## Flusso di login (come funziona oggi)

### 1. Mount iniziale dell'app

```js
// token inizializzato da localStorage (null se utente non autenticato)
const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))

// load() è definita dentro App, cattura `token` via closure
const load = () =>
  fetch('https://api.simonegentili.com/tome/timeboxes', { headers: { Authorization: token } })
    .then((r) => r.json())
    .then(setTimeboxes)  // ← setTimeboxes riceve qualunque cosa ritorni l'API

// Chiamata una sola volta al mount, con token = null
useEffect(() => {
  load()
}, [])
```

**Problema n.1:** `load()` viene chiamata subito al mount, con `token = null`. La richiesta HTTP parte senza autenticazione. L'API risponde probabilmente con un JSON di errore tipo:
```json
{ "error": "unauthorized" }
```
Questo oggetto viene passato direttamente a `setTimeboxes`. Quindi lo stato diventa:
```js
timeboxes = { error: "unauthorized" }  // ← oggetto, NON un array
```

---

### 2. Rendering pre-login

```js
const groups = token ? groupByDay(timeboxes) : {}
```

Con `token = null`, la condizione è `false` e `groupByDay` **non viene chiamata**. Il rendering prosegue senza errori, anche se `timeboxes` è un oggetto non iterabile.

---

### 3. Login: l'utente compila il form

```js
// In LoginModal.handleSubmit
const res = await fetch(AUTH_URL, { method: 'POST', ... })
const { token } = await res.json()
onSuccess(token)  // → handleLoginSuccess(tok)
```

```js
// In App
const handleLoginSuccess = (tok) => {
  localStorage.setItem(TOKEN_KEY, tok)
  setToken(tok)      // ← aggiorna lo stato con il token reale
  setShowLogin(false)
}
```

---

### 4. Re-render dopo login → IL CRASH

Dopo `setToken(tok)` React ri-renderizza il componente. Ora:

```js
const groups = token ? groupByDay(timeboxes) : {}
//                ↑ token è truthy
//                      ↑ groupByDay viene chiamata!
```

`groupByDay` tenta di iterare `timeboxes`:

```js
function groupByDay(timeboxes) {
  const groups = {}
  for (const p of timeboxes) {   // ← CRASH: timeboxes = { error: "unauthorized" }
    // ...
  }
}
```

`for...of` su un plain object (non iterable) lancia:

> **Uncaught TypeError: e is not iterable**

Schermata bianca. L'error boundary non esiste, quindi l'intera app crasha.

---

## Schema del bug

```
Mount
  └─ load() [token=null]
       └─ fetch /tome/timeboxes (no auth)
            └─ API risponde: { "error": "unauthorized" }
                 └─ setTimeboxes({ error: "unauthorized" })

Render pre-login
  └─ groups = token ? groupByDay(timeboxes) : {}
  └─ token=null → groups = {}  ✅ nessun errore

Login
  └─ setToken(realToken) → re-render

Render post-login
  └─ groups = groupByDay({ error: "unauthorized" })
  └─ for (const p of { error: "unauthorized" })
  └─ ❌ TypeError: e is not iterable → schermata bianca
```

---

## Cause radice (due problemi combinati)

| # | Problema | Dove |
|---|----------|------|
| 1 | `load()` non gestisce una risposta non-array dall'API | `load()` in `App` |
| 2 | `load()` non viene richiamata dopo il login (chiusura cattura il `token` iniziale) | `useEffect(load, [])` |

Il secondo problema causa anche un bug silenzioso: dopo il login, i timebox non vengono mai ricaricati con autenticazione.

---

## Fix proposti

### Fix minimo (blocca il crash)

Aggiungere una guardia in `load()` per assicurarsi che `timeboxes` sia sempre un array:

```js
const load = () =>
  fetch('https://api.simonegentili.com/tome/timeboxes', { headers: { Authorization: token } })
    .then((r) => r.json())
    .then((data) => setTimeboxes(Array.isArray(data) ? data : []))  // ← guardia
```

### Fix completo (corregge anche il reload post-login)

Refactoring di `load` per accettare il token come parametro ed includerlo nelle dipendenze:

```js
const load = async (tok) => {
  if (!tok) return
  try {
    const res = await fetch('https://api.simonegentili.com/tome/timeboxes', {
      headers: { Authorization: tok },
    })
    if (!res.ok) return
    const data = await res.json()
    setTimeboxes(Array.isArray(data) ? data : [])
  } catch {
    // silently fail
  }
}

useEffect(() => {
  load(token)
}, [token])  // ← si aggiorna quando il token cambia
```

Con questo fix:
- Al mount senza token → `load` non fa nulla
- Dopo login → `token` cambia, `useEffect` ri-esegue `load(tok)` con il token reale
- La risposta è garantita essere un array

---

## File coinvolti

- [src/App.jsx](src/App.jsx) — funzione `load()` (riga ~395) e `useEffect(load, [])` (riga ~401)
