# Focus Games — eight attention-training mini-games

Live: <https://one-thing-focus-game-zkwxfc.cranl.net>

Eight focus-training games rooted in attention-science research, with their own progressive level ladders. **47 levels** across **eight paradigms**. Plays on phone and web. Single static HTML file. No accounts, no analytics, no tracking — progress lives in your browser's `localStorage`.

## The eight games

| Game | Levels | Paradigm | What it trains |
|---|---|---|---|
| **One Thing** | 12 | CPT, SART, Stroop, MOT, NeuroRacer, Vigilance, Flanker, Visual Search, Attentional Blink, Breath, Change Blindness | A grand tour of attention paradigms |
| **Schulte 25** | 5 | Visual search · attention anchoring | Tap 1 → N in order under a clock |
| **Arrow Flanker** | 5 | Eriksen Flanker — selective attention | Respond to the center arrow, ignore flankers |
| **Color Conflict** | 5 | Stroop interference | Pick the ink, not the word |
| **N-Back** | 5 | Working memory · 1-back to 3-back | Match the symbol from N steps ago |
| **Box Breath** | 5 | Mindful 4-4-4-4 breathing | The cooldown — 1 to 5 minutes |
| **Digit Span** | 5 | Forward + backward digit span | Watch a sequence, tap it back |
| **Stop Signal** | 5 | Stop-signal / motor inhibition | Go on every arrow — except when the tone plays |

Each level uses **closed-loop adaptive difficulty** (75/65 thresholds — research-backed by ACE-X and the lifeart/focus reference app), and every game's results show **d-prime** alongside raw accuracy where the paradigm fits signal-detection theory.

## How to play

1. Open the live URL on your phone or laptop. (Or open `index.html` locally — no server needed.)
2. Pick a game. Pass at ≥75% accuracy to unlock the next level.
3. Each level walks you in: tutorial → 30 s practice → "Ready when you are" → real session.
4. Tap **Stats** on home to see per-game sparklines + per-level personal bests + activity calendar.
5. Tap **⚙ Settings** for audio, haptics, reduced motion, text size, and reset options.

## Mobile + web

Adapts automatically:

- **Desktop** — keyboard (`SPACE`, `← →`, `R B G Y`, `N`, digit keys for span) and mouse.
- **Mobile** — large tap buttons appear at the bottom of every game. Canvas-tap directly for visual-search / MOT / change-blindness / Schulte. Pinch-zoom and pull-to-refresh are disabled inside gameplay so accidental gestures don't break a session.

Detection is by `@media (any-pointer: coarse)`, so a phone-with-keyboard or tablet-in-laptop-mode picks up touch UI automatically.

## Install to your phone (PWA)

The site ships a `manifest.webmanifest` + service worker. On iOS Safari: tap Share → Add to Home Screen. On Android Chrome: tap the install prompt or the "Install app" menu item. The installed app:

- Opens in standalone mode (no browser chrome).
- Plays **offline** after the first visit.
- Honors the system theme (light / dark).

## File layout

```
Focus Game/
├── index.html              # The whole app (HTML + CSS + JS in one file)
├── manifest.webmanifest    # PWA install metadata
├── sw.js                   # Service worker — cache-first for shell + Google Fonts
├── Dockerfile              # nginx-based static deploy for CranL / any container PaaS
├── icon.svg                # Bullseye favicon (SVG)
├── icon-32.png             # Favicon raster
├── apple-icon.png          # Apple touch icon (180×180)
├── pwa-icon.png            # PWA / OG share image (512×512)
├── vercel.json             # Optional Vercel deploy config
├── package.json            # Optional npm scripts
├── README.md               # This file
└── IMPROVEMENT_PLAN.md     # Living roadmap
```

## Deploy

### CranL (current production deploy)

The live site uses CranL with a Dockerfile build serving via nginx, region: Riyadh.

To redeploy after a `git push origin main`, open the CranL dashboard → application → **Deploy**. To enable push-to-deploy: install the CranL GitHub App on the repo, then switch the application's source mode from "Public Git Repository" to "Connected Repository".

### Elsewhere — single static HTML, deploys anywhere

- **Vercel** — `vercel --prod` (config in `vercel.json`).
- **Netlify** — drag the folder onto netlify.com/drop.
- **Cloudflare Pages** — connect the GitHub repo, no build command.
- **GitHub Pages** — enable Pages from repo Settings, serve `index.html`.
- **surge.sh** — `npx surge`.
- **Self-hosted** — `python3 -m http.server` from the folder.

## Tech notes

- Single `index.html`. Zero npm runtime deps. No build step. ~5000 lines including 47 level constructors and 8 game registries.
- Fonts: **Inter** (body) + **Space Grotesk** (display), loaded from Google Fonts with `display=swap` and a `system-ui` fallback. Cached offline by the service worker.
- Accessibility: WCAG-AA contrast (muted `#6A6A65` on `#FAFAF7`), `prefers-reduced-motion`, `prefers-color-scheme: dark`, system text-size scaling (`--type-scale`), per-button `aria-label`.
- Persistence: LocalStorage `oneThing.v1` key with versioned schema and v1 → v2 migration.
- Adaptive difficulty: shared `makeAdaptive({initial, min, max, windowMs, upAt: 0.75, downAt: 0.65})` helper, used by all 47 levels.

## The science (and the honest caveat)

These paradigms have been used in cognitive psychology research since 1935 (Stroop) up through 2025 (gamified Stop-Signal). Practice on each one reliably improves performance *on that task*. Closed-loop adaptive training (the NeuroRacer → EndeavorRx lineage) has cleared the FDA for attention improvements in children with ADHD.

**What the literature debates:** whether "better at the SART" reliably transfers to "better at focusing on real-life tasks." Meta-analyses on n-back show small mixed far-transfer; most "brain training" apps overpromise here.

**The honest claim of this app:** the daily ritual of single-tasking is the real intervention. The app is a 10–15 minute commitment to sit down and focus on one thing. Your scores will improve — that part is reliable. Whether that translates to focusing better in the rest of your life is something only you can observe in your own life.

## Reset progress

In-app: **⚙ Settings** → "Reset progress for one game…" or "Reset ALL progress".

Via console:

```js
localStorage.removeItem('oneThing.v1'); location.reload();
```

## Credits

Game design: Muhannad Alsaif. Paradigm sources cited per-level inside the app (`?` icon on any level). Research consolidation via Exa search and the lifeart/focus reference repo (MIT).
