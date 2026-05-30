# Think It Through: Logic Puzzles game

**Status:** Spec ready, MVP scope locked
**Date:** 2026-05-26
**Author:** Muhannad Alsaif + Claude

## Goal

Add a 6th game to the existing multi-game hub: a logic puzzles game that forces the player to sit and think. Puzzles drawn from cognitive-science literature (the same paradigms examiners and scientists use). Progresses across 5 difficulty tiers from extremely easy to extremely hard.

## Why this game fits

The other 5 games in the project train attention (sustained, selective, divided, etc.). This one trains deductive reasoning, a different cognitive domain with its own scientific literature (Johnson-Laird syllogisms, Smullyan Knights & Knaves, LSAT-style reasoning).

Two pieces of evidence make this more than a brain-training fad:
- LSAT preparation studies (PLOS ONE, 2015, "Characterizing Behavioral and Brain Changes Associated with Practicing Reasoning Skills") show some transfer from intensive reasoning practice to untrained transitive inference tasks. Brain imaging found changes in the frontoparietal network.
- The Mental Models Training App study (Frontiers in Psychology, 2023) found that adaptive practice with deductive reasoning problems reliably improves verbal deductive reasoning, even without theoretical scaffolding.

The honest framing remains: the daily ritual of sustained thinking is the real intervention.

## Scope: MVP first

The full vision (4 puzzle types, 5 tiers, hints, citations, Einstein grids, classic riddles) is too big for one cycle. This spec describes the **MVP**. Future phases are listed as roadmap, not specced.

### MVP scope (what ships first)

- 5 difficulty tiers (extremely easy → extremely hard)
- **2 puzzle types only:** Syllogisms (procedural) + Knights & Knaves (procedural)
- Untimed sessions
- 5 puzzles per session, mechanically scored
- Pass at 4/5 to unlock next tier
- One UI primitive per type:
  - Syllogisms: 3 buttons (Valid / Invalid / Can't tell)
  - K&K: one card per person, each with Knight/Knave toggle buttons (matches existing tap-button pattern, no on-canvas grid)
- Bolts into existing hub via the `GAMES` registry and `GAME_META` block
- New accent color: amber `#D4A356`
- State for the new game initializes automatically via the existing `loadState()` migration code (no new code needed)

### Out of MVP scope (Phase 3+ roadmap)

- Einstein/zebra grids (deferred: mobile UX needs a separate design pass to meet 24px touch targets)
- Classic riddles (12 coins, 3 gods, river crossing): need self-graded reveal UI
- Tiered hints (90s trigger → 3 levels of nudge)
- Per-puzzle citations in the `?` info modal
- Adaptive puzzle count per tier
- Saw-curve ordering within a session
- Practice round with labeled-bubble walkthroughs

## Architecture

Drops into the existing single `index.html` as one more game alongside `oneThing`, `schulte`, `flanker`, `stroop`, `nback`.

### Files touched

Just `index.html`. No new files. Matches the project's "single file by design" pattern (README line 70).

### Code locations to extend

| Location | What to add |
|---|---|
| `GAMES` array (line ~913) | New entry `{ id: 'thinkItThrough', name: 'Think It Through', tagline: ..., accent: '#D4A356', totalLevels: 5 }` |
| `GAME_META` (line ~910) | `GAME_META.thinkItThrough = LEVEL_META_THINK` (defined later) |
| Tutorial / session / result functions | Extend `openTutorial`, `startSession`, `showResult` to dispatch on game type when `currentGameId === 'thinkItThrough'` |
| New: `PUZZLE_BANK_THINK` section near end of script | Generators + UI controllers for the 2 puzzle types |
| `LEVEL_META_THINK` block | 5 level entries with tier name, generator config, paradigm citation |

State initialization is handled automatically by existing `loadState()`, no changes needed there.

### State shape extension

The existing `loadState()` (index.html line 631) already handles state migration: it iterates over `GAME_IDS` and merges defaults with stored data. As long as `thinkItThrough` is added to the `GAMES` array, the migration is automatic, users with old localStorage will get an empty `thinkItThrough` state initialized for them on next load. **No new migration code needed.**

The new game's state will follow the existing shape:
```js
STATE.games.thinkItThrough = {
  unlockedLevel: 1,
  sessions: [],         // { levelId, score, accuracy, ts }
  bestScores: {},       // keyed by levelId
}
```

The `STATE.version` is already at 2 (line 622). No version bump needed.

## Puzzle types (MVP)

### Type 1: Syllogisms (procedural, Geurts-weighted)

**What it is:** "All A are B. C is A. Therefore C is ___?" Classic categorical reasoning.

**Generator approach:** Port the open-source Nickguitar/SyllogismGeneratorV2 algorithm (BSD-licensed JS). Generates all 256 mood × figure combinations, identifies which are valid using the 5 rules of syllogistic logic.

**Difficulty calibration:** Use Geurts cognitive cost weights (each monotonicity rule = 20 units; "Some Not" propositions = +10 units; reasoner starts with budget of 100). This is the empirically-validated difficulty metric from the syllogistic reasoning literature.

| Tier | Geurts cost band | Forms allowed | Content |
|---|---|---|---|
| 1: Extremely Easy | 0-20 | Barbara (AAA-1) only | Abstract terms (Klorps, Zogs) to remove belief bias |
| 2: Easy | 0-40 | Adds Celarent (EAE-1), Darii (AII-1), Ferio (EIO-1) | Abstract terms |
| 3: Medium | 0-70 | All 24 traditionally valid syllogisms, all 4 figures | Neutral content (triangles, vehicles, plants) |
| 4: Hard | 0-100 | Adds invalid syllogisms. Player must identify validity. | Neutral content |
| 5: Extremely Hard | 0-120+ | All forms (256 total) plus belief-bias traps | Real-world content where plausibility conflicts with logic |

**Note on Geurts bands:** These are an initial calibration based on the Geurts (2003) cost weights (monotonicity = 20 units; Some Not = +10 units). Final bands may need adjustment after the 50-puzzle playtest. The bands are cumulative. Tier 3 includes everything from Tiers 1-2 plus harder forms.

**Input UI:** 3 buttons
- `Valid`: the conclusion follows logically from the premises
- `Invalid`: the conclusion does not follow (premises don't support it)
- `Can't tell`: premises are insufficient to determine validity

Three options because real syllogistic reasoning has three responses, not two. Critical for Tier 4-5 where invalid forms appear.

**Word banks for abstract/neutral content:**
- Abstract: Klorps, Zogs, Brins, Voks, Drips, Mibs (nonsense words)
- Neutral: triangles, shapes, vehicles, plants, tools (low belief-bias content)
- Real-world (Tier 5 only): birds, mammals, animals, doctors, lawyers, etc.

**Validity rules** (from the literature, ported from Nickguitar repo):
1. The middle term must be distributed in at least one premise
2. If a term is distributed in the conclusion, it must be distributed in some premise
3. At least one premise must be affirmative
4. If a premise is negative, the conclusion must be negative
5. If both premises are universal, the conclusion must be universal

A generated syllogism is "valid" if it passes all 5 rules. The generator picks a target validity (true / false / can't-tell) per puzzle, then constructs accordingly.

### Type 2: Knights & Knaves (procedural, SAT-validated)

**What it is:** N characters on an island. Each says one or more statements about themselves or others. Knights always tell the truth; Knaves always lie. Determine each character's type.

**Generator approach:** Port the algorithm from nick-merrill/logic-puzzle-generator (or implement equivalent). For each puzzle:
1. Pick a target assignment of Knight/Knave for N people
2. Generate random statements consistent with that assignment
3. Pass through a tiny SAT solver (~100 lines) to verify unique solution
4. If not unique, regenerate

**Tier progression** introduces a new mechanic per tier (not just more people):

| Tier | People | Mechanic introduced | Example |
|---|---|---|---|
| 1: Extremely Easy | 2 | Direct self-reference | A says "I am a Knight." |
| 2: Easy | 3 | Statements about one other person | B says "A is a Knave." |
| 3: Medium | 3-4 | Compound statements with AND/OR | C says "A is a Knight AND B is a Knave." |
| 4: Hard | 4 | Statements about counts | D says "Exactly two of us are Knaves." |
| 5: Extremely Hard | 4-5 | Conditional statements | E says "If F is a Knight, then I am a Knave." |

**Input UI:** Each person rendered as a labeled card. Each card has 2 buttons: `Knight` (white/light) and `Knave` (dark). Tap to toggle. Submit button at bottom validates all selections at once.

Matches the existing project's tap-button mobile pattern. No grid UI needed.

**Statement types and tier introduction:**

| Type | First appears | Example |
|---|---|---|
| `SelfIdentity(person, type)` | Tier 1 | "I am a Knight" |
| `OtherIdentity(person, target, type)` | Tier 2 | "A is a Knave" |
| `And(stmt1, stmt2)` | Tier 3 | "A is a Knight AND B is a Knave" |
| `Or(stmt1, stmt2)` | Tier 3 | "Either A or B is a Knight" |
| `Count(operator, type, n)` | Tier 4 | "Exactly 2 of us are Knaves" |
| `Conditional(antecedent, consequent)` | Tier 5 | "If A is a Knight, then I am a Knave" |

Once a type is introduced at a tier, it remains available at all higher tiers (cumulative).

## Session flow

Mirrors existing games. From `index.html` line ~1078 onward (`openTutorial`, `startSession`, `showResult`):

1. **Tutorial card**: same UI as other games, shows level name and what the player will be doing
2. **Live session**: 5 puzzles randomly drawn from the generator at current tier's difficulty
3. **After each puzzle**: instant feedback (correct/incorrect, with the right answer revealed if wrong)
4. **Result screen**: score (X/5), accuracy %, time per puzzle (display only, not scored), unlock notification if 4/5 reached

No practice round in MVP. Defer the labeled-bubble walkthrough to Phase 3.

## UI styling

Reuse existing CSS variables and components. New rules needed:

```css
/* Logic puzzles game-specific */
.puzzle-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  margin: 16px 0;
}

.puzzle-statement {
  font-size: 18px;
  line-height: 1.5;
  color: var(--ink);
}

.knight-knave-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.knight-knave-toggle button {
  min-height: 48px;  /* WCAG 2.2 enhanced touch target */
  padding: 12px;
}

.syllogism-answers {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.syllogism-answers button {
  min-width: 100px;
  min-height: 48px;
}
```

Touch target sizes meet WCAG 2.2 enhanced (44×44 CSS px), uses 48px for safety. This matches the existing game's mobile tap buttons.

## Testing strategy

Since this is a static `index.html` file with no test runner, testing is manual + assertion-based at runtime.

### Generator validity (auto-check on game load)

In dev mode (`localhost`), run a one-time validation:
```js
function validateGenerators() {
  // Generate 100 syllogisms at each tier, verify the validity check matches expected output
  for (let tier = 1; tier <= 5; tier++) {
    for (let i = 0; i < 100; i++) {
      const puzzle = generateSyllogism(tier);
      console.assert(puzzle.correctAnswer in ['valid', 'invalid', 'cant-tell']);
      console.assert(puzzle.geurtsCost >= TIER_BANDS[tier].min);
      console.assert(puzzle.geurtsCost <= TIER_BANDS[tier].max);
    }
  }
  // Generate 100 K&K puzzles, verify SAT solver returns unique solution
  // ...
}
if (location.hostname === 'localhost') validateGenerators();
```

### Manual playtest checklist

- Open in Chrome, Safari, Firefox: all puzzle types render
- Open on phone (real device, not just devtools): tap targets are reachable
- Submit a wrong answer: feedback is clear, doesn't break the session
- Complete level 1: unlocks level 2 (verify in localStorage)
- Refresh page mid-session: state recovers gracefully
- Start with a fresh localStorage: game initializes without errors

### Validation checkpoint: 50 hand-solved puzzles

Before shipping, manually solve 10 puzzles per tier (50 total). Verify:
- Tier 1 takes < 1 minute each
- Tier 5 takes 5-15 minutes each
- Difficulty progression feels right
- No ambiguous puzzles (all have a clear single correct answer)

If a tier feels wrong, adjust the Geurts cost bands or K&K mechanic mapping.

## Honest claim note

Add to the `?` info on the game card:

> Practicing deductive reasoning has shown some evidence of transfer in research, more than most "brain training" tasks. (LSAT preparation studies have shown improvements on untrained transitive inference tests.) The gap between "better at puzzles" and "better at real-world decisions" is still real. The honest benefit is the daily ritual: putting your phone down and sitting with a problem until you understand it.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Procedural syllogism gen produces ambiguous puzzles | Use deterministic Geurts validity checker; reject ambiguous outputs and regenerate |
| K&K SAT solver has bugs → puzzles unsolvable | Add validateGenerators() that runs 100 puzzles at each tier on dev load; assert each has unique solution |
| State migration breaks existing user progress on other 5 games | Migration is purely additive (only adds the new game key); existing game state untouched |
| Mobile tap targets too small | Enforce `min-height: 48px` in CSS; manual test on real iPhone SE (smallest current viewport) |
| Player feels syllogism task is repetitive | Geurts-tiered progression introduces real mechanic changes per tier (not just bigger numbers) |
| Generators run slow on low-end devices | All generators are O(n) where n = small (≤ 5 people, ≤ 3 premises); should be <10ms per puzzle |

## Roadmap (post-MVP, not in this spec)

Phase 3 (next):
- Add Einstein/zebra grids (with mobile UX redesign, likely separate cards-per-clue rather than on-canvas grid)
- Add classic riddles (wolf-goat-cabbage, 12 coins, 3 gods) with self-graded reveal page
- Tiered hint system (90s timer → 3 levels of nudge)
- Per-puzzle citations in the `?` info

Phase 4:
- Practice rounds with labeled-bubble walkthroughs (matching existing pattern)
- Adaptive puzzle count per tier (8/6/4/3/2)
- Saw-curve ordering inside a session
- Replay protection (avoid repeating recent puzzles)

## Definition of done (MVP)

- [ ] `thinkItThrough` entry in `GAMES` array, visible on hub home
- [ ] 5 levels render with name, tier, paradigm tagline
- [ ] Generators produce 100 unique puzzles per tier without crashing
- [ ] Syllogism UI: 3 buttons, instant feedback, correct answer revealed if wrong
- [ ] K&K UI: cards with toggle buttons, submit button, instant feedback
- [ ] Pass at 4/5 unlocks next tier
- [ ] State persists in localStorage across page refresh
- [ ] Loading the page with old localStorage (pre-thinkItThrough) does not crash and initializes the new game empty
- [ ] Manual playtest passes on Chrome desktop and iPhone Safari (real device, not just devtools)
- [ ] 50 hand-solved puzzles confirm difficulty calibration

---

**Once approved, this spec hands off to the `superpowers:writing-plans` skill to produce a step-by-step implementation plan.**
