# One Thing — A Focus Game

A small browser-based focus game grounded in real attention-science research. Six levels, each based on a published cognitive paradigm. Calm visuals. Single-tasking is the actual game.

## How to play

1. Open `index.html` in any modern browser (Chrome, Safari, Firefox, Edge). No install, no server.
2. Start with Level 1. Pass at ≥75% accuracy to unlock the next.
3. Play 10–15 minutes a day. The streak counter is the gentle nudge.
4. Click `?` next to any level to read what cognitive paradigm it's based on.

Each level walks you in gently:
- **Tutorial card** — what the rules are.
- **30-second practice round** — score doesn't count. Every event gets a labeled bubble (`Hit!`, `Don't press for 3`, `That was the WORD — press the INK color`, etc.) so you learn by doing.
- **"Ready when you are"** — choose to start the real session or practice another 30 seconds.
- **Live session** — the rule banner stays at the top of the screen the whole time, so you never forget what you're supposed to do.

Progress is stored locally on your device (`localStorage`). No accounts, no analytics, nothing leaves your machine.

## The twelve levels

| # | Name | Paradigm | Duration | What it trains |
|---|------|----------|----------|----------------|
| 1 | Hold the Dot | Sustained Attention (CPT) | 2 min | Vigilance under monotony |
| 2 | Skip the Three | SART (go/no-go) | 2.5 min | Attention + response inhibition |
| 3 | The Color Trap | Stroop interference | 3 min | Cognitive control |
| 4 | Track the Target | Selective attention | 3 min | Filtering distractors |
| 5 | Two Things at Once | Dual-task / NeuroRacer | 3 min | Divided attention |
| 6 | The Long Hold | Vigilance decrement | 6 min | Endurance under boredom |
| 7 | Arrow Storm | Flanker task | 2.5 min | Selective attention to a center target |
| 8 | The Search | Visual search (T among Ls) | 3 min | Attentional scanning |
| 9 | Track the Many | Multiple Object Tracking | 3.5 min | Parallel attentional indexing |
| 10 | The Blink | Attentional blink (RSVP) | 3 min | Temporal attention |
| 11 | Breath Pacer | Mindful single-pointing | 4 min | Sustained internal focus |
| 12 | Find What Changed | Change blindness | 3 min | Focused attention to detail |

Each level uses **closed-loop adaptive difficulty** — the same approach used in the FDA-approved EndeavorRx — so the game gets harder as you get better.

The variety isn't decorative: each paradigm targets a different aspect of attention (sustained, selective, divided, temporal, internal). Mixing them across days of practice is more effective than grinding one task — and reduces the boredom that kills daily-practice habits.

## The science (and the honest caveat)

The six paradigms here are real. They've been used in cognitive psychology research since 1935 (Stroop) up through 2013 (NeuroRacer). The relevant primary citations are inside the game (`?` icon on each level).

**What the literature does say:** practice on these tasks reliably improves your performance on those tasks. Closed-loop adaptive training (NeuroRacer / EndeavorRx) has shown measurable, cleared-by-the-FDA improvements in attention in older adults and children with ADHD.

**What the literature doesn't fully say:** whether "better at the SART" reliably transfers to "better at focusing on real-life tasks" is genuinely debated. Meta-analyses on working-memory training (n-back) show small, mixed far-transfer effects. Most "brain training" apps overpromise here.

**The honest claim of this game:** the daily ritual of single-tasking is the real intervention. The game is a 10–15 minute commitment to sit down and focus on one thing. Track your own scores over weeks — you'll see your numbers improve. Whether that translates to focusing better in the rest of your life is something only you can observe in your own life.

## Mobile + desktop

The game adapts to your device:

- **Desktop**: keyboard (`SPACE`, `← →`, `R B G Y`, `N`) and mouse — same as before.
- **Mobile / touch**: tap-buttons appear at the bottom of the screen with the same actions. The Visual Search, MOT, and Change-Blindness levels accept finger taps directly on the canvas. Pinch-zoom and pull-to-refresh are disabled inside the game so accidental gestures don't break a session.

The mobile layout uses a `(any-pointer: coarse)` media query, so a laptop in tablet mode or a phone-with-keyboard combo will get touch buttons whenever a coarse pointer is detected — even if a fine pointer is also available.

## File structure

```
Focus Game/
├── index.html       # The whole game (HTML + CSS + JS)
├── README.md        # This file
├── vercel.json      # Vercel deployment config
└── package.json     # Optional npm scripts (start / deploy)
```

Single file by design. Easier to share, copy, modify. If it grows, split into separate `.css` and `.js` later.

## Deploy to Vercel

The game is a static HTML file, so deployment is one command.

**One-time setup:**

```bash
npm install -g vercel    # if you don't already have it
```

**Deploy a preview:**

```bash
cd "Focus Game"
vercel
```

Follow the prompts — first time, link the directory to a new Vercel project. You'll get a preview URL like `one-thing-abc123.vercel.app`.

**Deploy to production:**

```bash
vercel --prod
```

(Or `npm run deploy` if you've installed dependencies via `npm install`.)

That's it. The site is live at your project's `*.vercel.app` URL.

## Deploy elsewhere (Netlify / Cloudflare / GitHub Pages / surge)

Because the whole game is one static HTML file with no build step:

- **Netlify**: drag the project folder onto netlify.com/drop.
- **Cloudflare Pages**: connect the GitHub repo, no build command needed, output directory is `.`.
- **GitHub Pages**: push to a `gh-pages` branch or enable Pages from the repo settings; serve `index.html`.
- **surge.sh**: `npx surge` from the project folder.

## Reset progress

Open the browser console on the page and run:

```js
localStorage.removeItem('oneThing.v1'); location.reload();
```

## Credits

Game design: Muhannad Alsaif. Paradigm sources cited per-level inside the game.
