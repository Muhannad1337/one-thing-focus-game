# Focus Games — Review & Improvement Plan **v2**

> Re-audited 2026-05-22 by playing every level, reading every constructor, and re-running Exa research. Live URL: <https://one-thing-focus-game-zkwxfc.cranl.net>. Supersedes the prior v1 plan; carries forward unfinished items and adds new findings.

## 1. Where we are right now

| Layer | State |
|---|---|
| Repo | `Muhannad1337/one-thing-focus-game` · `main` at `9de575a` (mobile fixes) |
| Last deployed commit on CranL | `c77975d` ("Rename icon files") — **9de575a mobile fixes still not on the server** |
| Code | 4,310 lines, single `index.html`, zero runtime deps |
| Games | 5 games / 32 levels (One Thing 12 · Schulte 5 · Flanker 5 · Stroop 5 · N-Back 5) |
| Persistence | LocalStorage v2 schema, per-game progress, v1→v2 migration verified |
| Branding | Bullseye favicon (SVG + 32 PNG + 180 Apple) |
| Deploy | nginx-via-Dockerfile on CranL (Riyadh region) |

## 2. Fresh test results — 2026-05-22

### Automated 32-level structural sweep — 29/32 pass

I drove every level's `init() → tick() → finish()` cycle from the running page.

**3 oneThing levels fail when `LEVEL_META` points to a different game** (`Cannot read properties of undefined (reading 'accent')`):
- L8 — The Search
- L9 — Track the Many
- L11 — Breath Pacer

They work when the game context is `oneThing`, but the latent crash from a mid-render game switch is real. The other 9 oneThing levels and all 20 levels of the other 4 games pass cleanly.

### Visual pass — desktop 1024 + mobile 375

| Surface | Result |
|---|---|
| Home / 5-game hub | ✅ clean on both |
| Schulte 4×4 live | ⚠ "Next: 1" label clips under the stats line on mobile |
| Flanker tutorial + practice | ✅ rule banner clear; ← → keys legible |
| Console errors | none |

### The user explicitly flagged

> *"font is bad"*

**Confirmed root cause**: the font stack is `-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif`. Inter is listed *after* the OS system fonts, so it **never actually loads**. Every screen renders in whatever default OS font ships — SF Pro on Apple, Segoe UI on Windows, Roboto on Android. That's fine fallback behaviour, but there's no actual typographic identity.

### Other observations carried from prior audit (still unfixed)

- **9de575a not deployed**: three real-mobile fixes (centerY helper for tap-zone occlusion, Stroop L5 6-colour tap layout, hide-empty-tap-zone) are committed but not on the server.
- Adaptive difficulty (`makeAdaptive`) used only by One Thing — the 4 new games use static per-level difficulty.
- Streak is account-level, not per-game.
- N-Back lure logic allows lures before history exists for the requested N (confusing trial 2 trap on L3+).
- README still describes a single-game, vercel-deployed, "Six levels" world. Stale.

## 3. The plan — prioritised, ordered, each step shippable

### P0 — Ship what's already done

**0.1 Redeploy `9de575a`.** No code change. Just trigger a fresh build on CranL so real-mobile players get the three fixes in the existing commit.

### P1 — Quick wins (≤ 30 min each, high visible impact)

**1.1 Fix the font** *(direct fix for the "font is bad" complaint)*
- Add Google Fonts `<link rel="preconnect">` + `<link href="...">` for **Inter Variable** (weights 400 + 500 + 600 + 700) and **Space Grotesk** 600 for display.
- Use `display=swap` so first paint shows system fallback, then upgrades.
- Set body to `font-family: 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;`
- Set `h1` / rule-banner to `font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;`
- Enable Inter character variants: `font-feature-settings: 'cv05', 'cv11', 'ss01';`
- Enable tabular numerals everywhere with numbers: `font-variant-numeric: tabular-nums;`

**1.2 Fix the 3 fragile oneThing constructors** *(removes latent crash)*
- L8, L9, L11 currently do `LEVEL_META[N].accent` (global, switches per game).
- Replace with `GAME_META.oneThing[N].accent` (anchored).
- Apply same fix to L1, L2, L4, L5, L6, L7, L10 to be consistent — small grep+replace.

**1.3 Fix the Schulte mobile overlap** *(real visible bug on phones)*
- Move the `Grid 1 · hits 0 · misses 0` stats line out of the rule-bar zone.
- Either put it inside the grid area as a small caption above row 1, or below the grid.

**1.4 README rewrite**
- Title: *"Focus Games — five attention-training mini-games"*
- Table: list the 5 games + count of levels each, sum = 32.
- Replace "Deploy to Vercel" section with "Deploy to CranL" (and note that Vercel/Netlify/etc still work — single static HTML).
- Add live URL banner at the top.

**1.5 Contrast pass** *(carries from v1, never done)*
- `--muted: #8A8A85` on `#FAFAF7` is **3.8:1** — below WCAG AA's 4.5:1.
- Darken to `#6A6A65` (≈6.0:1) for body muted text; keep the lighter shade only for de-emphasised meta.

### P2 — Real platform features (1–2 hours each)

**2.1 PWA (manifest + service worker)** *(biggest UX upgrade for "playable on phone")*
- Add `manifest.webmanifest`: name, short_name, icons (32, 180, 512), `theme_color: #FAFAF7`, `background_color: #FAFAF7`, `display: "standalone"`, `orientation: "portrait"`.
- Add `<link rel="manifest" href="/manifest.webmanifest">` to `<head>`.
- Add `sw.js` (≤80 lines): cache-first for `/`, `/index.html`, icons; network-fallback for the rest.
- Register from inline script: `if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');`
- Update Dockerfile to `COPY` the new files into `/usr/share/nginx/html/`.
- Verification: install to a phone home screen, kill network, launch — must load and play offline.

**2.2 Stats dashboard** *(carries from v1)*
- New "Stats" button on home page.
- Sheet shows: per-game last-30 score sparkline (canvas-rendered, no library), best-per-level table, lifetime sessions, current/best streak, day-by-day calendar grid (GitHub-contribution style, 12 weeks visible).
- All client-side from existing `sessions[]` arrays.

**2.3 Settings sheet**
- Gear icon top-right of home.
- Audio on/off (move existing toggle here).
- Haptics on/off (`navigator.vibrate` gating).
- Reduce motion on/off (disables stage flashes + breath pulse).
- Font scale: small / medium / large.
- Reset *this game* / Reset *all*.

**2.4 CranL auto-deploy** *(no more manual Deploy clicks)*
- Authorise the CranL GitHub App on `Muhannad1337/one-thing-focus-game`.
- Switch the application's source type from "Public Git Repository" to "Connected Repository".
- Verification: push a one-line README edit, watch a deploy fire within 60 s.

### P3 — Adaptive everywhere + better metrics (research-backed)

**3.1 Wire `makeAdaptive` into the 4 new games**
- Schulte: shuffle interval / grid-reshuffle frequency.
- Flanker: stim duration window.
- Stroop: stim duration window.
- N-Back: auto-step-up N on 3 consecutive perfect runs (the Jaeggi 2008 protocol).

**3.2 Switch staircase thresholds to 75 / 65** *(per Exa: lifeart/focus precedent + ACE-X paper)*
- Current: 85 / 60. Players plateau or churn.
- New: increase difficulty at 75% recent accuracy, decrease at 65%. Keeps the learner in the optimal challenge band.

**3.3 d-prime alongside accuracy** *(go/no-go, SART, n-back)*
- Compute `d′ = z(hit_rate) − z(false_alarm_rate)`.
- Show both in the results screen: *"Accuracy 84% · d′ 1.92"*.
- d′ accounts for response bias; raw accuracy doesn't.

### P4 — Game depth (2–4 hours per new game)

**4.1 Three new games** *(answering the user's earlier "develop more games")*
- **Span** — digit span (forward then backward). 5 levels: 4 → 5 → 6 → 7 → 8 digits, with backward at top. Verbal short-term memory; trains held-in-mind capacity that focus depends on. Cite Wechsler / Engle.
- **Stop Signal** — go on every arrow but inhibit on a ~25% rate of stop-tone trials. 5 levels of decreasing stop-signal delay. Cleanest measure of motor inhibition. Cite Logan & Cowan 1984; gamified Stop-Signal paper (JMIR 2020).
- **Box Breath** — 4-4-4-4 box breathing pacer (inhale 4, hold 4, exhale 4, hold 4). 5 levels: 1, 2, 3, 4, 5 minutes. Mindful end-of-session cooldown. Strongest evidence for real-world transfer of any paradigm here.

**4.2 (stretch) Cross-game daily challenge**
- One curated (game, level) chosen per day, pinned to the top of home with a 24h countdown.
- Completing it adds a streak-shield bonus.

### P5 — Accessibility & polish (1–3 hours total)

**5.1 Honour system font scaling**
- Switch base `font-size: 16px` to `font-size: 100%`.
- Use `rem` everywhere instead of `px` for type sizes.
- Result: iOS/Android system text-size accessibility setting flows through.

**5.2 `prefers-reduced-motion`**
- Wrap `stage-flash-good/bad` and the L1 breath circle pulse in `@media (prefers-reduced-motion: no-preference)`.

**5.3 Color-blind safety**
- Every accent colour gets paired with a shape/letter cue (e.g. the Stroop colour buttons already show the letter — verify the rest don't rely on hue alone).

**5.4 Dark mode**
- Variables already in `:root`. Add a `@media (prefers-color-scheme: dark)` block that flips `--bg`, `--ink`, `--panel`, `--line`.

**5.5 Open Graph + share preview**
- `<meta property="og:title">`, `og:description`, `og:image` (use `pwa-icon.png` resized to 1200×630), `og:url`.
- Sharing the link in iMessage/WhatsApp will then show a card.

### P6 — Code hygiene (background)

**6.1 Per-level meta in init signature** *(cleanest fix for P1.2)*
- Change `levelInstance.init(env)` to `levelInstance.init(env, meta)`.
- Constructor closures no longer reach into globals.

**6.2 `TUNING` constants block at top of script**
- Group `PRACTICE_DURATION`, unlock-accuracy threshold, adaptive staircase thresholds, recency window — all the magic numbers in one place.

**6.3 Defer file split**
- Single-file is a deployability feature. Split only when crossing ~6000 lines.

## 4. Recommended order of execution

Each step independently shippable. Estimated total: 1–2 focused sessions for P0–P2, another for P3, ongoing for P4–P6.

1. **P0.1** — Redeploy `9de575a`. *(2 min)*
2. **P1.1** — Font swap to Inter + Space Grotesk. *(15 min)*
3. **P1.2** — Fix the 3 fragile constructors. *(10 min)*
4. **P1.3** — Schulte mobile overlap. *(10 min)*
5. **P1.5** — Contrast pass. *(5 min)*
6. **P2.4** — Authorise CranL GitHub App → auto-deploy. *(5 min once you're in the dashboard)*
7. **P2.1** — PWA manifest + SW. *(45 min)*
8. **P1.4** — README rewrite. *(15 min)*
9. **P2.2** — Stats dashboard. *(90 min)*
10. **P2.3** — Settings sheet. *(45 min)*
11. **P3.x** — Adaptive everywhere + d′. *(90 min)*
12. **P4.1** — One new game per session (Box Breath first — simplest + highest-value). *(2 h each)*
13. **P5.x** — Accessibility pass. *(60 min)*
14. **P6.x** — Code hygiene refactor. *(60 min)*

## 5. Verification after each step

- **After font swap**: screenshot desktop + mobile; verify FOIT mitigated by `display=swap`; confirm Inter renders.
- **After constructor fixes**: re-run the 32-level structural sweep — must hit 32/32 regardless of which game is "current".
- **After PWA**: phone install → kill network → launch → must boot and play through one level.
- **After stats**: play 3 sessions in 3 different games → open dashboard → numbers match.
- **After each new game**: structural pass + real-time L1 play to results.
- **After CranL auto-deploy**: push a no-op README edit → deploy fires within 60 s.

## 6. What we are explicitly NOT changing

- Single-file `index.html` architecture (deployability is a feature, not a constraint to escape).
- Zero npm runtime deps; build step stays empty.
- Local-only progress (stated to the user in the footer).
- The "5-game hub" framing (Span, Stop Signal, Box Breath add a sixth-through-eighth game; the hub model is right).
- The cream-on-ink palette as the *default*; dark mode is an opt-in via `prefers-color-scheme`.

## 7. Sources

### From today's audit (Exa, 2026-05-22)

- [Appy Pie — App Typography Guide: 2-Font Rule + 6 Industry Pairings](https://www.appypie.com/blog/app-typography-guide)
- [Mantlr — The Typography Stack That Works Everywhere (2026)](https://mantlr.com/blog/typography-stack-everywhere)
- [WebAbility — Best Font for Readability 2026](https://www.webability.io/blog/best-font-for-readability)
- [system-fonts/modern-font-stacks (GitHub)](https://github.com/system-fonts/modern-font-stacks)
- [lifeart/focus — TS PWA cognitive training reference app](https://github.com/lifeart/focus)
- [ChrisBrooksbank/attention — TS PWA attention trainer](https://github.com/ChrisBrooksbank/attention)
- [LessUp/mind-gym — vanilla-JS PWA memory trainer](https://github.com/LessUp/mind-gym)
- [Effective Gamification of the Stop-Signal Task — JMIR Games 2020](https://games.jmir.org/2020/3/e17810/)
- [Antisaccade training plasticity — Frontiers 2015](https://www.frontiersin.org/articles/10.3389/fnhum.2015.00653/pdf)

### Carried from prior audit

- ACE-X validation (JMIR 2025) — adaptive response window, one-up-four-down staircase, ~79.4% accuracy as the moderate-difficulty sweet spot.
- Adaptive Dual N-Back in ADHD (PubMed 2025-09) — 204% gain vs ~50% for fixed-N.
- Gamified Flanker (MDPI 2024) — ML staircase preserves conflict effect in young children.
- "Retention in a Low Attention Economy" (dev.to 2026-04) — first 10–15 min critical, session-momentum > appointment mechanics.
- Mobile Game UX (ejaw.net 2026-03) — thumb zone, F-pattern, juicy feedback, 80–120 ms response onset.
- Serious Games systematic review (Frontiers 2026-05) — engagement is a clinical variable.
