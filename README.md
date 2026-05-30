# Focus Games

> Six focus-training mini-games rooted in attention-science research. Practice
> single-tasking on phone or web. No accounts, no analytics.

Live: <https://one-thing-focus-game-zkwxfc.cranl.net>

## What's inside

| Game | Levels | Trains | Paradigm |
|---|---|---|---|
| **One Thing** | 12 | Sustained attention, inhibition, dual-task, search, breath | CPT · SART · Stroop · MOT · Flanker · Visual search · RSVP · Breath pacer · Change blindness |
| **Schulte 25** | 5 | Visual search, attention anchoring | Schulte table |
| **Arrow Flanker** | 5 | Selective attention, response inhibition | Eriksen flanker |
| **Color Conflict** | 5 | Interference control | Stroop color-word |
| **N-Back** | 5 | Working memory + sustained focus | Kirchner n-back |
| **Think It Through** | 5 | Logical reasoning under attentional load | Constraint-satisfaction puzzles |

Total: **37 levels** across **6 games**.

Each game has its own progression (≥75% accuracy unlocks the next level), its
own best scores, its own session history. Progress is local-only — stored in
`localStorage`, never sent anywhere.

## Tech

- **Single static HTML file** (`index.html`), ~4,400 lines of vanilla JS
- **Zero runtime dependencies** — no React, no build step, no bundler
- **PWA**: manifest + service worker → installable + offline-playable on phone
- **Touch + keyboard parity**: every game playable with either
- **Light + dark** via `prefers-color-scheme`
- **Inter + Space Grotesk** (Google Fonts, `display=swap` so first paint is fast)
- **Adaptive difficulty** per level via a one-up-four-down staircase helper
- **Backwards-compatible storage**: v1 → v2 schema migration on first load

## Deploy

### CranL (production)

The live site runs on CranL with a tiny nginx image:

```
docker build -t one-thing-focus-game .
docker run -p 80:80 one-thing-focus-game
```

The Dockerfile copies `index.html`, all four icon assets, `manifest.webmanifest`,
`sw.js`, and `README.md` into `/usr/share/nginx/html/`. nginx serves them with
sensible cache headers (no-cache for HTML/SW/manifest, immutable for icons).

### Anywhere else

It's a static HTML file — drop it on Vercel, Netlify, Cloudflare Pages,
GitHub Pages — anything that serves files works. `vercel.json` is included
for convenience.

```
npm start          # python3 -m http.server 5173
```

## Architecture

Everything lives in `index.html`:

- **Game registry** (`GAMES`, `GAME_META`) — flat array of 6 games + per-game
  level metadata
- **Engine** — single `requestAnimationFrame` loop that calls
  `levelInstance.tick(now, elapsed)`; each level is a closure returning
  `{ id, tapMode, init, tick, handleKey, handleClick, finish }`
- **Tap zones** — `tapMode` (`"space"`, `"arrows"`, `"colors"`, `"none"`)
  renders touch buttons on coarse-pointer devices that synthesize keyboard
  events; 5+ color palettes wrap into a `tap-colors-multi` 2-row layout
- **Adaptive helper** — `makeAdaptive({ initial, min, max, windowMs })`
  tracks correct/error counts over a rolling window and steps difficulty
  up at ≥75% accuracy, down at ≤65%
- **Storage** — `STORAGE_KEY = 'oneThing.v1'`, v2 schema lives under
  `STATE.games[gameId]`, migration runs on first load if the stored object
  is the old v1 shape
- **Visual identity** — `:root` CSS vars `--bg`, `--ink`, `--muted`,
  `--accent`, etc. Dark mode flips them under `@media (prefers-color-scheme: dark)`
- **PWA** — `manifest.webmanifest` + `sw.js` register on `load`. Service worker
  is cache-first for the app shell and network-first for everything else,
  with an offline fallback to `/`

## Research foundation

Games chosen for evidence of measurable transfer or established psychometrics:

- Eriksen flanker (Eriksen & Eriksen, 1974)
- Stroop color-word (Stroop, 1935)
- Kirchner n-back (Kirchner, 1958)
- Schulte tables (Schulte, 1955)
- CPT / vigilance (Rosvold et al., 1956; Mackworth, 1948)
- SART (Robertson et al., 1997)
- MOT (Pylyshyn & Storm, 1988)
- Attentional blink (Raymond et al., 1992)
- Change blindness (Rensink et al., 1997)
- Breath counting / mindfulness (Levinson et al., 2014)
- Adaptive staircase difficulty (Levitt 1971; ACE-X validation, JMIR 2025)
- Adaptive dual n-back (Jaeggi et al., 2008; ADHD replication, PubMed 2025)

## License

Free to use, modify, fork, and ship. Attribution welcomed, not required.
