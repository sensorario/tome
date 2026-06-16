# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Structure

```
client/   React + Vite frontend
server/   Vanilla PHP backend (no framework)
```

## Commands

```bash
make install   # installa dipendenze server e client
make start     # avvia server (porta 8000) e client (Vite) in parallelo — Ctrl+C per fermare
make test      # esegue PHPUnit
make server    # solo server PHP
make client    # solo client Vite
```

Note: `composer` non è nel PATH — il Makefile usa `/tmp/composer` (scaricato al primo setup).

## Architecture

**Server** — `server/src/Router.php` is a minimal router: register handlers with `->get(path, callable)`, dispatch with `->dispatch(method, path)` returning `['status' => int, 'body' => array]`. `public/index.php` wires it and writes JSON. Tests exercise the Router class directly (no HTTP layer).

**Client** — Vite proxies `/api/*` to `http://localhost:8000` stripping the `/api` prefix, so `fetch('/api/')` hits the PHP `/` route. `App.jsx` fetches on mount and renders the response.