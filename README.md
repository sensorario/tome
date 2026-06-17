# Tracker

A Pomodoro timer and session tracker. Start 25-minute focus sessions, enforce cooldown between them, and keep a running history with optional notes.

## What it does

- **Start a Pomodoro** — clicking the button creates a new session; the server enforces a 25-minute cooldown so you can't stack sessions back-to-back
- **Countdown** — while a session is cooling down, the UI shows a live MM:SS countdown until the next one is available
- **Session history** — all past sessions are listed grouped by day, most recent first
- **Notes** — double-click any session to add or edit a description; press Enter to save or Escape to cancel

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Vanilla PHP (no framework) |
| Database | SQLite (`~/.sensorario-tracker/tracker.db`) |

## Getting started

```bash
make install   # install server (Composer) and client (npm) dependencies
make start     # start PHP server on :8000 and Vite dev server in parallel
```

Then open the URL printed by Vite (typically `http://localhost:5173`).

## Commands

```bash
make install   # install dependencies
make start     # start both server and client (Ctrl+C to stop)
make server    # start PHP server only (port 8000)
make client    # start Vite dev server only
make test      # run PHPUnit tests
```

## API

All routes are prefixed `/api` in the browser (Vite proxies to `:8000`).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/pomodoros` | List all sessions, newest first |
| `POST` | `/pomodoros` | Start a new session (409 if cooldown active) |
| `PATCH` | `/pomodoros/:id` | Update a session's description |

A 409 response includes `seconds_remaining` so the client can display the countdown.