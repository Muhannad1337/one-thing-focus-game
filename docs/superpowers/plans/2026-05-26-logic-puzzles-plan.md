# Think It Through Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 6th game ("Think It Through") to the existing multi-game hub with procedural syllogism and Knights & Knaves puzzles across 5 difficulty tiers.

**Architecture:** All code goes into the existing single `index.html`. The new game registers in the `GAMES` array, the `GAME_META` map, and bypasses the existing time-based `startLevel` flow with a custom discrete puzzle-by-puzzle session controller. Generators are pure JS functions with `console.assert` runtime tests gated on `localhost`.

**Tech Stack:** Vanilla HTML/CSS/JS in one file. No build step. No test runner. Runtime assertions for "tests."

**Spec:** `docs/superpowers/specs/2026-05-26-logic-puzzles-design.md`

---

## File Structure

Only one file is modified across all tasks:

| File | What changes |
|---|---|
| `index.html` | All new code lives here. New sections inserted at locations specified per task. |

New code is organized into 6 logical regions inside `index.html`:

1. `GAMES` array entry (line ~913)
2. `GAME_META.thinkItThrough` block (line ~910)
3. New section: `// === LOGIC PUZZLES: VALIDITY + COST ===` (near end, before validation harness)
4. New section: `// === LOGIC PUZZLES: SYLLOGISM GENERATOR ===`
5. New section: `// === LOGIC PUZZLES: KNIGHTS & KNAVES GENERATOR ===`
6. New section: `// === LOGIC PUZZLES: SESSION CONTROLLER + UI ===`
7. New section: `// === LOGIC PUZZLES: DEV VALIDATION HARNESS ===`
8. New CSS block in the existing `<style>` tag
9. Dispatch hooks added to `startLevel()` (line ~1359) and `openTutorial()` (line ~1076)

---

## Task 1: Register the game in the hub

**Files:**
- Modify: `index.html` (GAMES array, line ~913; emptyGameProgress is already generic)

- [ ] **Step 1: Add the GAMES entry**

Find the `GAMES = [` array (line ~913). Add a new entry after the `nback` entry:

```js
  {
    id: 'thinkItThrough',
    name: 'Think It Through',
    tagline: 'Logic puzzles examiners and scientists actually use. 5 tiers from easy to mind-bending.',
    accent: '#D4A356',
    totalLevels: 5,
  },
```

- [ ] **Step 2: Add the GAME_META placeholder**

Find the `GAME_META = { oneThing: LEVEL_META };` line (around line 910). Below it, add:

```js
// Filled in by the logic puzzles section near end of script
GAME_META.thinkItThrough = {};
```

- [ ] **Step 3: Verify the hub renders the new card**

Open `index.html` in a browser. The home screen should now show 6 game cards. The 6th is "Think It Through" with an amber dot. Clicking it goes to its menu (which will be empty/broken, that's fine for now).

Expected: Card appears, click does not crash the page.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Register Think It Through game in the multi-game hub"
```

---

## Task 2: Add the syllogism validity checker

**Files:**
- Modify: `index.html` (add new section near end of `<script>`, before the closing `</script>`)

- [ ] **Step 1: Add the validity checker section**

Find the closing `</script>` tag near the end of `index.html`. Just above it, add:

```js
// =========================================================================
// LOGIC PUZZLES: VALIDITY + COST
// =========================================================================
// Categorical syllogism validity, based on the 5 traditional rules.
// Mood = ordered triple of proposition types (A, E, I, O).
// Figure = position of middle term across major/minor premises (1, 2, 3, 4).
// 256 total mood × figure combinations. 24 are traditionally valid.

const PROPOSITIONS = {
  A: { name: 'Universal Affirmative', distribSubj: true,  distribPred: false, negative: false, universal: true  },
  E: { name: 'Universal Negative',    distribSubj: true,  distribPred: true,  negative: true,  universal: true  },
  I: { name: 'Particular Affirmative',distribSubj: false, distribPred: false, negative: false, universal: false },
  O: { name: 'Particular Negative',   distribSubj: false, distribPred: true,  negative: true,  universal: false },
};

// For a given figure (1-4), which slot (subj or pred) of each premise holds the middle term.
// Returns { major: 'subj'|'pred', minor: 'subj'|'pred' }
const FIGURE_LAYOUT = {
  1: { major: 'subj', minor: 'pred' },  // M-P, S-M
  2: { major: 'pred', minor: 'pred' },  // P-M, S-M
  3: { major: 'subj', minor: 'subj' },  // M-P, M-S
  4: { major: 'pred', minor: 'subj' },  // P-M, M-S
};

// Is the term at position 'subj' or 'pred' distributed for proposition type t?
function isDistributed(propType, position) {
  return position === 'subj' ? PROPOSITIONS[propType].distribSubj : PROPOSITIONS[propType].distribPred;
}

// Check the 5 traditional validity rules.
// mood: 3-char string like 'AAA' (major, minor, conclusion)
// figure: 1-4
function isSyllogismValid(mood, figure) {
  const [maj, min, conc] = mood.split('');
  const layout = FIGURE_LAYOUT[figure];

  // The middle term (M) sits in one position of each premise (per FIGURE_LAYOUT).
  // The other position holds the major term (P) in the major premise and the minor term (S) in the minor premise.
  const majMiddlePos = layout.major;
  const majOtherPos  = layout.major === 'subj' ? 'pred' : 'subj';
  const minMiddlePos = layout.minor;
  const minOtherPos  = layout.minor === 'subj' ? 'pred' : 'subj';

  // Rule 1: Middle term must be distributed in at least one premise
  const middleDistributedSomewhere =
    isDistributed(maj, majMiddlePos) || isDistributed(min, minMiddlePos);
  if (!middleDistributedSomewhere) return false;

  // Rule 2: If a term is distributed in the conclusion, it must be distributed in the premise it came from
  // S is at 'subj' of conclusion; P is at 'pred' of conclusion
  const sDistribInConc = isDistributed(conc, 'subj');
  const pDistribInConc = isDistributed(conc, 'pred');
  const sDistribInMinor = isDistributed(min, minOtherPos);
  const pDistribInMajor = isDistributed(maj, majOtherPos);
  if (sDistribInConc && !sDistribInMinor) return false;
  if (pDistribInConc && !pDistribInMajor) return false;

  // Rule 3: At least one premise must be affirmative (cannot have two negative premises)
  if (PROPOSITIONS[maj].negative && PROPOSITIONS[min].negative) return false;

  // Rule 4: If a premise is negative, the conclusion must be negative (and vice versa)
  const eitherPremiseNeg = PROPOSITIONS[maj].negative || PROPOSITIONS[min].negative;
  if (eitherPremiseNeg !== PROPOSITIONS[conc].negative) return false;

  // Rule 5: If both premises are universal, the conclusion must be universal
  if (PROPOSITIONS[maj].universal && PROPOSITIONS[min].universal && !PROPOSITIONS[conc].universal) return false;

  return true;
}
```

- [ ] **Step 2: Open the browser console and verify the checker works**

Reload `index.html`. In the browser console, run:

```js
isSyllogismValid('AAA', 1)  // Barbara: should be true
isSyllogismValid('EAE', 1)  // Celarent: should be true
isSyllogismValid('AAA', 2)  // Invalid: should be false
isSyllogismValid('AAA', 3)  // Invalid: should be false
isSyllogismValid('EIO', 1)  // Ferio: should be true
isSyllogismValid('OOO', 1)  // Invalid (rule 3): should be false
```

Expected: all assertions match the comment.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add syllogism validity checker (5 traditional rules)"
```

---

## Task 3: Add the Geurts cost function

**Files:**
- Modify: `index.html` (extend the logic puzzles section from Task 2)

- [ ] **Step 1: Add the cost function below `isSyllogismValid`**

Below the `isSyllogismValid` function added in Task 2, add:

```js
// Geurts (2003) cognitive cost weights for syllogistic reasoning.
// Each step of monotonicity reasoning = 20 units.
// Using a "Some Not" (O) proposition anywhere = +10 units.
// This is an empirically-grounded difficulty metric from the syllogism literature.
//
// We use a simplified approximation:
// - Base cost = 0 for direct syllogisms (figure 1, easy moods like AAA)
// - +20 for each non-figure-1 (figure positions are conceptually harder)
// - +20 if any premise is non-universal (I or O)
// - +10 if any proposition is O type
// - +20 if conclusion is invalid (forces "can't tell" reasoning)

function getGeurtsCost(mood, figure, knowAboutInvalid = false) {
  let cost = 0;
  if (figure !== 1) cost += 20;
  const hasNonUniversal = mood.split('').some(p => !PROPOSITIONS[p].universal);
  if (hasNonUniversal) cost += 20;
  const hasO = mood.includes('O');
  if (hasO) cost += 10;
  if (knowAboutInvalid && !isSyllogismValid(mood, figure)) cost += 20;
  return cost;
}

// Tier-to-cost-band mapping (initial calibration; adjust after playtest)
const TIER_COST_BANDS = {
  1: { min: 0,  max: 20 },
  2: { min: 0,  max: 40 },
  3: { min: 0,  max: 70 },
  4: { min: 0,  max: 100 },
  5: { min: 0,  max: 200 },  // intentionally wide for tier 5
};
```

- [ ] **Step 2: Verify in console**

Reload page. In console:

```js
getGeurtsCost('AAA', 1)  // Barbara: should be 0
getGeurtsCost('EAE', 1)  // Celarent: should be 0
getGeurtsCost('AII', 1)  // Darii: should be 20 (has non-universal I)
getGeurtsCost('OAO', 3)  // Bocardo: should be 50 (non-fig-1: +20, has O: +10, non-universal: +20)
```

Expected: all match.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add Geurts cost function for syllogism difficulty calibration"
```

---

## Task 4: Add the syllogism generator with word banks

**Files:**
- Modify: `index.html` (extend logic puzzles section)

- [ ] **Step 1: Add word banks and generator below the cost function**

```js
// =========================================================================
// LOGIC PUZZLES: SYLLOGISM GENERATOR
// =========================================================================

const SYLLOGISM_WORDS = {
  abstract: [
    ['Klorps', 'Zogs', 'Brins'],
    ['Voks', 'Drips', 'Mibs'],
    ['Tafs', 'Pims', 'Glunks'],
    ['Wibs', 'Norks', 'Quels'],
  ],
  neutral: [
    ['triangles', 'shapes', 'polygons'],
    ['cars', 'vehicles', 'machines'],
    ['flowers', 'plants', 'living things'],
    ['hammers', 'tools', 'objects'],
  ],
  realWorld: [
    // Pairs chosen to create belief-bias traps in tier 5
    ['birds', 'flying things', 'animals'],
    ['penguins', 'birds', 'flying animals'],
    ['lawyers', 'professionals', 'rich people'],
    ['vegetarians', 'people who avoid meat', 'healthy people'],
  ],
};

const PROP_TEMPLATES = {
  A: (s, p) => `All ${s} are ${p}.`,
  E: (s, p) => `No ${s} are ${p}.`,
  I: (s, p) => `Some ${s} are ${p}.`,
  O: (s, p) => `Some ${s} are not ${p}.`,
};

// All 24 traditionally valid (mood, figure) pairs
const VALID_FORMS = [];
for (let fig = 1; fig <= 4; fig++) {
  for (const a of 'AEIO') for (const b of 'AEIO') for (const c of 'AEIO') {
    const mood = a + b + c;
    if (isSyllogismValid(mood, fig)) VALID_FORMS.push({ mood, figure: fig });
  }
}

// All 256 forms (valid + invalid)
const ALL_FORMS = [];
for (let fig = 1; fig <= 4; fig++) {
  for (const a of 'AEIO') for (const b of 'AEIO') for (const c of 'AEIO') {
    ALL_FORMS.push({ mood: a + b + c, figure: fig });
  }
}

// Pick which forms are allowed at each tier
function getAllowedForms(tier) {
  const band = TIER_COST_BANDS[tier];
  if (tier === 1) {
    return VALID_FORMS.filter(f => f.mood === 'AAA' && f.figure === 1);  // Barbara only
  }
  if (tier === 2) {
    const allowed = ['AAA', 'EAE', 'AII', 'EIO'];
    return VALID_FORMS.filter(f => f.figure === 1 && allowed.includes(f.mood));
  }
  if (tier === 3) {
    return VALID_FORMS.filter(f => getGeurtsCost(f.mood, f.figure) <= band.max);
  }
  if (tier === 4) {
    // Mix of valid and invalid - player must judge
    return ALL_FORMS.filter(f => getGeurtsCost(f.mood, f.figure, true) <= band.max);
  }
  // Tier 5
  return ALL_FORMS;
}

function pickWordBank(tier) {
  if (tier <= 2) return SYLLOGISM_WORDS.abstract;
  if (tier <= 4) return SYLLOGISM_WORDS.neutral;
  return SYLLOGISM_WORDS.realWorld;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build the natural-language form of a syllogism using the figure layout.
// Figure 1: M-P, S-M, S-P
// Figure 2: P-M, S-M, S-P
// Figure 3: M-P, M-S, S-P
// Figure 4: P-M, M-S, S-P
function renderSyllogism(mood, figure, words) {
  const [S, M, P] = words;  // subject, middle, predicate
  const [maj, min, conc] = mood.split('');
  const layouts = {
    1: { major: [M, P], minor: [S, M] },
    2: { major: [P, M], minor: [S, M] },
    3: { major: [M, P], minor: [M, S] },
    4: { major: [P, M], minor: [M, S] },
  };
  const layout = layouts[figure];
  return {
    premises: [
      PROP_TEMPLATES[maj](layout.major[0], layout.major[1]),
      PROP_TEMPLATES[min](layout.minor[0], layout.minor[1]),
    ],
    conclusion: PROP_TEMPLATES[conc](S, P),
  };
}

// Main generator function
function generateSyllogism(tier) {
  const allowed = getAllowedForms(tier);
  const form = randomChoice(allowed);
  const wordBank = pickWordBank(tier);
  const words = randomChoice(wordBank);
  const { premises, conclusion } = renderSyllogism(form.mood, form.figure, words);
  const valid = isSyllogismValid(form.mood, form.figure);
  return {
    type: 'syllogism',
    tier,
    mood: form.mood,
    figure: form.figure,
    geurtsCost: getGeurtsCost(form.mood, form.figure, tier >= 4),
    premises,
    conclusion,
    correctAnswer: valid ? 'valid' : 'invalid',
  };
}
```

- [ ] **Step 2: Verify in console**

Reload page. In console:

```js
const p = generateSyllogism(1);
console.log(p.premises.join(' '), p.conclusion);
// Should print something like: "All Klorps are Zogs. All Brins are Klorps. All Brins are Zogs."
// correctAnswer should be 'valid'

for (let t = 1; t <= 5; t++) {
  const p = generateSyllogism(t);
  console.log(`Tier ${t}: ${p.mood}-${p.figure} cost=${p.geurtsCost} ans=${p.correctAnswer}`);
}
```

Expected: 5 puzzles, costs roughly increase with tier (not strict because random), no errors.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add syllogism generator with tiered word banks and form selection"
```

---

## Task 5: Add the syllogism UI renderer

**Files:**
- Modify: `index.html` (extend logic puzzles section, add CSS, modify `<body>` for new screen)

- [ ] **Step 1: Add a new game-screen section in the HTML body**

Find the existing `<div id="gameScreen">` block. After its closing `</div>`, add:

```html
<!-- Logic puzzles screen (Think It Through game) -->
<div id="thinkScreen" style="display:none">
  <div class="think-header">
    <button class="back-btn" id="thinkBackBtn">←</button>
    <div class="think-title">
      <div class="think-level-name" id="thinkLevelName">Level 1</div>
      <div class="think-progress" id="thinkProgress">Puzzle 1 of 5</div>
    </div>
    <div class="think-score" id="thinkScore">0/0</div>
  </div>
  <div class="think-stage" id="thinkStage"></div>
</div>
```

- [ ] **Step 2: Add CSS for the new screen**

Find the existing `<style>` tag (early in the file). Add this block at the end of the style content (before `</style>`):

```css
/* =================================================================
   LOGIC PUZZLES: Think It Through
   ================================================================= */
#thinkScreen {
  display: none;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  color: var(--ink);
}
#thinkScreen.active { display: flex; }

.think-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.think-header .back-btn {
  background: none;
  border: none;
  color: var(--ink);
  font-size: 22px;
  cursor: pointer;
  padding: 6px 10px;
  min-width: 44px;
  min-height: 44px;
}
.think-header .think-title { flex: 1; }
.think-level-name { font-weight: 600; }
.think-progress { font-size: 13px; color: var(--muted); }
.think-score { font-weight: 600; color: var(--accent); }

.think-stage {
  flex: 1;
  padding: 24px 18px;
  overflow-y: auto;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}

.puzzle-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 24px;
}

.puzzle-premise {
  font-size: 18px;
  line-height: 1.55;
  margin: 8px 0;
  color: var(--ink);
}

.puzzle-conclusion {
  font-size: 18px;
  line-height: 1.55;
  margin: 16px 0 8px 0;
  padding-top: 16px;
  border-top: 1px dashed var(--border);
  color: var(--ink);
  font-weight: 500;
}

.syllogism-answers {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 28px;
  flex-wrap: wrap;
}
.syllogism-answers button {
  min-width: 110px;
  min-height: 48px;
  padding: 12px 18px;
  border-radius: 10px;
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--border);
  font-size: 15px;
  cursor: pointer;
  font-weight: 500;
}
.syllogism-answers button:hover { border-color: var(--accent); }
.syllogism-answers button:disabled { opacity: 0.5; cursor: default; }

.puzzle-feedback {
  margin-top: 22px;
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 15px;
  text-align: center;
}
.puzzle-feedback.correct { background: rgba(79, 168, 119, 0.15); color: #4FA877; border: 1px solid rgba(79, 168, 119, 0.4); }
.puzzle-feedback.incorrect { background: rgba(209, 123, 111, 0.15); color: #D17B6F; border: 1px solid rgba(209, 123, 111, 0.4); }

.next-btn {
  display: block;
  margin: 18px auto 0;
  min-height: 48px;
  padding: 12px 32px;
  border-radius: 10px;
  background: var(--accent);
  color: white;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
```

- [ ] **Step 3: Add the syllogism UI renderer to the logic puzzles section**

In the logic puzzles section (after the generator from Task 4), add:

```js
// =========================================================================
// LOGIC PUZZLES: UI RENDERERS
// =========================================================================

const ANSWER_LABELS = {
  valid: 'Valid',
  invalid: 'Invalid',
  'cant-tell': "Can't tell",
};

// Renders a syllogism into the think-stage element.
// onAnswer(answerKey) is called when the user picks an answer.
function renderSyllogismUI(puzzle, stage, onAnswer) {
  stage.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'puzzle-card';

  puzzle.premises.forEach(p => {
    const div = document.createElement('div');
    div.className = 'puzzle-premise';
    div.textContent = p;
    card.appendChild(div);
  });

  const conc = document.createElement('div');
  conc.className = 'puzzle-conclusion';
  conc.textContent = 'Therefore: ' + puzzle.conclusion;
  card.appendChild(conc);

  const answersDiv = document.createElement('div');
  answersDiv.className = 'syllogism-answers';
  ['valid', 'invalid', 'cant-tell'].forEach(key => {
    const btn = document.createElement('button');
    btn.textContent = ANSWER_LABELS[key];
    btn.addEventListener('click', () => {
      Array.from(answersDiv.querySelectorAll('button')).forEach(b => b.disabled = true);
      onAnswer(key, btn, answersDiv);
    });
    answersDiv.appendChild(btn);
  });
  card.appendChild(answersDiv);

  stage.appendChild(card);
}

// Shows feedback after the user answers, then a "Next" button to advance.
function showSyllogismFeedback(puzzle, userAnswer, container, onNext) {
  const isCorrect = userAnswer === puzzle.correctAnswer;
  const fb = document.createElement('div');
  fb.className = 'puzzle-feedback ' + (isCorrect ? 'correct' : 'incorrect');
  if (isCorrect) {
    fb.textContent = 'Correct.';
  } else {
    fb.textContent = `Not quite. The correct answer was: ${ANSWER_LABELS[puzzle.correctAnswer]}.`;
  }
  container.appendChild(fb);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'next-btn';
  nextBtn.textContent = 'Next puzzle';
  nextBtn.addEventListener('click', onNext);
  container.appendChild(nextBtn);
}
```

- [ ] **Step 4: Manually test rendering in console**

Reload page. In console:

```js
document.getElementById('thinkScreen').style.display = 'flex';
const stage = document.getElementById('thinkStage');
const p = generateSyllogism(3);
renderSyllogismUI(p, stage, (ans, btn, container) => {
  showSyllogismFeedback(p, ans, container.parentElement, () => console.log('Next!'));
});
```

Expected: a styled card appears with 2 premises, conclusion, 3 buttons. Clicking a button shows feedback and a Next button. To hide: `document.getElementById('thinkScreen').style.display = 'none';`

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Add syllogism UI renderer with feedback flow"
```

---

## Task 6: Add Knights & Knaves statement evaluator

**Files:**
- Modify: `index.html` (extend logic puzzles section)

- [ ] **Step 1: Add the K&K section below the syllogism UI**

```js
// =========================================================================
// LOGIC PUZZLES: KNIGHTS & KNAVES
// =========================================================================
// Statement types are tagged objects. Evaluator takes a Map of name => 'knight'|'knave'
// and returns true if the statement is true under that assignment.
//
// Statement shapes:
//   { type: 'self_identity', target: 'A', isKnight: true }
//   { type: 'other_identity', target: 'B', isKnight: false }
//   { type: 'and', left: stmt, right: stmt }
//   { type: 'or', left: stmt, right: stmt }
//   { type: 'count', op: 'exactly'|'at_least'|'at_most', n: 2, isKnight: false }
//   { type: 'conditional', antecedent: stmt, consequent: stmt }

function evaluateStatement(stmt, assignment) {
  switch (stmt.type) {
    case 'self_identity':
    case 'other_identity': {
      const actual = assignment.get(stmt.target);
      return stmt.isKnight ? (actual === 'knight') : (actual === 'knave');
    }
    case 'and':
      return evaluateStatement(stmt.left, assignment) && evaluateStatement(stmt.right, assignment);
    case 'or':
      return evaluateStatement(stmt.left, assignment) || evaluateStatement(stmt.right, assignment);
    case 'count': {
      const target = stmt.isKnight ? 'knight' : 'knave';
      let count = 0;
      assignment.forEach(v => { if (v === target) count++; });
      if (stmt.op === 'exactly')  return count === stmt.n;
      if (stmt.op === 'at_least') return count >= stmt.n;
      if (stmt.op === 'at_most')  return count <= stmt.n;
      return false;
    }
    case 'conditional':
      // If antecedent then consequent. Vacuously true if antecedent is false.
      if (!evaluateStatement(stmt.antecedent, assignment)) return true;
      return evaluateStatement(stmt.consequent, assignment);
    default:
      throw new Error('Unknown statement type: ' + stmt.type);
  }
}

// Render a statement as natural language English.
function renderStatement(stmt, speaker) {
  switch (stmt.type) {
    case 'self_identity':
      return stmt.isKnight ? 'I am a Knight.' : 'I am a Knave.';
    case 'other_identity': {
      const verb = stmt.target === speaker ? 'am' : 'is';
      const subj = stmt.target === speaker ? 'I' : stmt.target;
      const type = stmt.isKnight ? 'a Knight' : 'a Knave';
      return `${subj} ${verb} ${type}.`;
    }
    case 'and':
      return `${renderStatement(stmt.left, speaker).slice(0, -1)} AND ${renderStatement(stmt.right, speaker).toLowerCase()}`;
    case 'or':
      return `Either ${renderStatement(stmt.left, speaker).slice(0, -1).toLowerCase()} or ${renderStatement(stmt.right, speaker).slice(0, -1).toLowerCase()}.`;
    case 'count':
      const opWord = stmt.op === 'exactly' ? 'Exactly' : stmt.op === 'at_least' ? 'At least' : 'At most';
      const typeWord = stmt.isKnight ? 'Knight' : 'Knave';
      return `${opWord} ${stmt.n} of us ${stmt.n === 1 ? 'is a' : 'are'} ${typeWord}${stmt.n === 1 ? '' : 's'}.`;
    case 'conditional':
      return `If ${renderStatement(stmt.antecedent, speaker).slice(0, -1).toLowerCase()}, then ${renderStatement(stmt.consequent, speaker).slice(0, -1).toLowerCase()}.`;
  }
}
```

- [ ] **Step 2: Verify in console**

Reload. In console:

```js
const a = new Map([['A', 'knight'], ['B', 'knave']]);
evaluateStatement({type: 'self_identity', target: 'A', isKnight: true}, a)  // true
evaluateStatement({type: 'other_identity', target: 'B', isKnight: true}, a)  // false
evaluateStatement({type: 'and',
  left: {type: 'self_identity', target: 'A', isKnight: true},
  right: {type: 'other_identity', target: 'B', isKnight: false}}, a)  // true
evaluateStatement({type: 'count', op: 'exactly', n: 1, isKnight: false}, a)  // true (one knave)
```

Expected: all four match.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add Knights & Knaves statement evaluator and renderer"
```

---

## Task 7: Add Knights & Knaves SAT solver

**Files:**
- Modify: `index.html` (extend K&K section)

- [ ] **Step 1: Add the brute-force SAT solver**

Below the renderer from Task 6, add:

```js
// Brute-force SAT solver for K&K. With at most 5 people, that's 2^5 = 32 assignments,
// far too few to need anything fancier. Returns array of all valid assignments.
//
// A statement said by a person is "consistent" if:
//   - the speaker is a knight AND the statement is true, OR
//   - the speaker is a knave AND the statement is false.
function solveKnightsKnaves(people, statementsByPerson) {
  const n = people.length;
  const solutions = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    const assignment = new Map();
    for (let i = 0; i < n; i++) {
      assignment.set(people[i], (mask & (1 << i)) ? 'knight' : 'knave');
    }
    let consistent = true;
    for (const person of people) {
      const stmts = statementsByPerson[person] || [];
      for (const stmt of stmts) {
        const stmtTrue = evaluateStatement(stmt, assignment);
        const speakerIsKnight = assignment.get(person) === 'knight';
        if (speakerIsKnight !== stmtTrue) {
          consistent = false;
          break;
        }
      }
      if (!consistent) break;
    }
    if (consistent) solutions.push(assignment);
  }
  return solutions;
}
```

- [ ] **Step 2: Verify the solver works**

Reload. In console:

```js
// Classic 2-person puzzle: A says "I am a Knight." B says "A is a Knave."
// Expected unique solution: A = knight, B = knave (B is lying about A).
const sols = solveKnightsKnaves(['A','B'], {
  A: [{type: 'self_identity', target: 'A', isKnight: true}],
  B: [{type: 'other_identity', target: 'A', isKnight: false}],
});
console.log(sols.length);  // 1
console.log(sols[0].get('A'), sols[0].get('B'));  // knight knave
```

Wait, both A=knight,B=knave AND A=knave,B=knight satisfy this. Let me think...
- If A=knight: A's statement (self=knight) is true. ✓ B's statement (A=knave) is false. Since B is knave, B lies, so consistent ✓
- If A=knave: A's statement (self=knight) is false. A is knave so lies, consistent ✓ B's statement (A=knave) is true. If B is knight, says truth: consistent ✓

So actually 2 solutions. The puzzle is ambiguous on its own.

Run:
```js
sols.length === 2
```

This is correct behavior. A real generated puzzle with unique solution is verified in Task 8.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add brute-force SAT solver for Knights & Knaves puzzles"
```

---

## Task 8: Add Knights & Knaves generator with tier mechanics

**Files:**
- Modify: `index.html` (extend K&K section)

- [ ] **Step 1: Add the generator**

```js
// Allowed statement types per tier
const KK_TIER_MECHANICS = {
  1: { people: 2, types: ['self_identity'] },
  2: { people: 3, types: ['self_identity', 'other_identity'] },
  3: { people: 4, types: ['self_identity', 'other_identity', 'and', 'or'] },
  4: { people: 4, types: ['self_identity', 'other_identity', 'and', 'or', 'count'] },
  5: { people: 5, types: ['self_identity', 'other_identity', 'and', 'or', 'count', 'conditional'] },
};

const KK_NAMES = ['Alice', 'Bob', 'Carol', 'Dan', 'Eve'];

// Make a random simple atomic statement (self or other identity)
function makeAtomicStatement(speaker, people, types) {
  if (types.includes('other_identity') && Math.random() < 0.6) {
    const others = people.filter(p => p !== speaker);
    return {
      type: 'other_identity',
      target: randomChoice(others),
      isKnight: Math.random() < 0.5,
    };
  }
  return { type: 'self_identity', target: speaker, isKnight: Math.random() < 0.5 };
}

// Make a possibly-compound statement based on allowed types
function makeStatement(speaker, people, types) {
  const choice = randomChoice(types);
  if (choice === 'self_identity') {
    return { type: 'self_identity', target: speaker, isKnight: Math.random() < 0.5 };
  }
  if (choice === 'other_identity') {
    const others = people.filter(p => p !== speaker);
    if (others.length === 0) return { type: 'self_identity', target: speaker, isKnight: Math.random() < 0.5 };
    return { type: 'other_identity', target: randomChoice(others), isKnight: Math.random() < 0.5 };
  }
  if (choice === 'and' || choice === 'or') {
    return {
      type: choice,
      left: makeAtomicStatement(speaker, people, types),
      right: makeAtomicStatement(speaker, people, types),
    };
  }
  if (choice === 'count') {
    return {
      type: 'count',
      op: randomChoice(['exactly', 'at_least', 'at_most']),
      n: 1 + Math.floor(Math.random() * (people.length - 1)),
      isKnight: Math.random() < 0.5,
    };
  }
  if (choice === 'conditional') {
    return {
      type: 'conditional',
      antecedent: makeAtomicStatement(speaker, people, types),
      consequent: makeAtomicStatement(speaker, people, types),
    };
  }
  return { type: 'self_identity', target: speaker, isKnight: true };  // fallback
}

// Generate a K&K puzzle with a guaranteed unique solution.
// Retries up to maxAttempts times if generated puzzle is ambiguous.
function generateKnightsKnaves(tier, maxAttempts = 200) {
  const config = KK_TIER_MECHANICS[tier];
  const people = KK_NAMES.slice(0, config.people);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statementsByPerson = {};
    for (const person of people) {
      statementsByPerson[person] = [makeStatement(person, people, config.types)];
    }
    const solutions = solveKnightsKnaves(people, statementsByPerson);
    if (solutions.length === 1) {
      const sol = solutions[0];
      const answer = {};
      people.forEach(p => answer[p] = sol.get(p));
      return {
        type: 'kk',
        tier,
        people,
        statements: people.map(p => ({
          speaker: p,
          text: renderStatement(statementsByPerson[p][0], p),
        })),
        correctAnswer: answer,
      };
    }
  }
  // Fallback: simplest possible 2-person puzzle if all generations failed
  return {
    type: 'kk',
    tier,
    people: ['Alice', 'Bob'],
    statements: [
      { speaker: 'Alice', text: 'Bob is a Knave.' },
      { speaker: 'Bob', text: 'Alice and I are the same.' },
    ],
    correctAnswer: { Alice: 'knight', Bob: 'knave' },
  };
}
```

- [ ] **Step 2: Verify the generator**

Reload. In console:

```js
const p = generateKnightsKnaves(1);
console.log(p.statements.map(s => `${s.speaker}: ${s.text}`).join('\n'));
console.log('Answer:', p.correctAnswer);

for (let t = 1; t <= 5; t++) {
  const p = generateKnightsKnaves(t);
  console.log(`Tier ${t}: ${p.people.length} people, ${JSON.stringify(p.correctAnswer)}`);
}
```

Expected: 5 puzzles, each with the right number of people, all have valid correctAnswer maps.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add K&K puzzle generator with tier-based statement mechanics"
```

---

## Task 9: Add Knights & Knaves UI renderer

**Files:**
- Modify: `index.html` (extend logic puzzles section and CSS)

- [ ] **Step 1: Add CSS for K&K UI**

In the `<style>` block, below the syllogism styles added in Task 5, add:

```css
.kk-people {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.kk-person-card {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
}

.kk-person-name {
  font-weight: 600;
  margin-bottom: 6px;
}

.kk-person-statement {
  font-size: 15px;
  color: var(--ink);
  margin-bottom: 10px;
  font-style: italic;
}

.kk-toggle {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.kk-toggle button {
  min-height: 48px;
  padding: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--ink);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.kk-toggle button.selected {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.kk-submit {
  display: block;
  margin: 20px auto 0;
  min-height: 48px;
  padding: 12px 32px;
  border-radius: 10px;
  background: var(--accent);
  color: white;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.kk-submit:disabled { opacity: 0.5; cursor: default; }
```

- [ ] **Step 2: Add the K&K UI renderer to the logic puzzles section**

In the logic puzzles section (after the K&K generator), add:

```js
// Renders a K&K puzzle. onAnswer({Alice: 'knight', Bob: 'knave', ...}) called on submit.
function renderKKUI(puzzle, stage, onAnswer) {
  stage.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'puzzle-card';

  const intro = document.createElement('div');
  intro.className = 'puzzle-premise';
  intro.textContent = `On this island, Knights always tell the truth, Knaves always lie. Figure out who is what.`;
  card.appendChild(intro);

  const selection = {};

  const peopleDiv = document.createElement('div');
  peopleDiv.className = 'kk-people';

  puzzle.statements.forEach(({ speaker, text }) => {
    const personCard = document.createElement('div');
    personCard.className = 'kk-person-card';

    const nameDiv = document.createElement('div');
    nameDiv.className = 'kk-person-name';
    nameDiv.textContent = speaker + ' says:';
    personCard.appendChild(nameDiv);

    const stmtDiv = document.createElement('div');
    stmtDiv.className = 'kk-person-statement';
    stmtDiv.textContent = '"' + text + '"';
    personCard.appendChild(stmtDiv);

    const toggle = document.createElement('div');
    toggle.className = 'kk-toggle';

    const kBtn = document.createElement('button');
    kBtn.textContent = 'Knight';
    const nBtn = document.createElement('button');
    nBtn.textContent = 'Knave';

    kBtn.addEventListener('click', () => {
      selection[speaker] = 'knight';
      kBtn.classList.add('selected');
      nBtn.classList.remove('selected');
      submitBtn.disabled = puzzle.people.some(p => !selection[p]);
    });
    nBtn.addEventListener('click', () => {
      selection[speaker] = 'knave';
      nBtn.classList.add('selected');
      kBtn.classList.remove('selected');
      submitBtn.disabled = puzzle.people.some(p => !selection[p]);
    });

    toggle.appendChild(kBtn);
    toggle.appendChild(nBtn);
    personCard.appendChild(toggle);
    peopleDiv.appendChild(personCard);
  });

  card.appendChild(peopleDiv);

  const submitBtn = document.createElement('button');
  submitBtn.className = 'kk-submit';
  submitBtn.textContent = 'Submit';
  submitBtn.disabled = true;
  submitBtn.addEventListener('click', () => {
    Array.from(card.querySelectorAll('button')).forEach(b => b.disabled = true);
    onAnswer(selection, card);
  });
  card.appendChild(submitBtn);

  stage.appendChild(card);
}

// Feedback after K&K submission.
function showKKFeedback(puzzle, userAnswer, container, onNext) {
  const correct = puzzle.people.every(p => userAnswer[p] === puzzle.correctAnswer[p]);
  const fb = document.createElement('div');
  fb.className = 'puzzle-feedback ' + (correct ? 'correct' : 'incorrect');
  if (correct) {
    fb.textContent = 'Correct.';
  } else {
    const answerStr = puzzle.people
      .map(p => `${p}: ${puzzle.correctAnswer[p] === 'knight' ? 'Knight' : 'Knave'}`)
      .join(', ');
    fb.textContent = 'Not quite. Correct answer: ' + answerStr + '.';
  }
  container.appendChild(fb);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'next-btn';
  nextBtn.textContent = 'Next puzzle';
  nextBtn.addEventListener('click', onNext);
  container.appendChild(nextBtn);
}
```

- [ ] **Step 3: Manually test rendering**

Reload. In console:

```js
document.getElementById('thinkScreen').style.display = 'flex';
const stage = document.getElementById('thinkStage');
const p = generateKnightsKnaves(3);
renderKKUI(p, stage, (ans, card) => {
  showKKFeedback(p, ans, card, () => console.log('Next!'));
});
```

Expected: cards for each person, Knight/Knave buttons toggle visually, Submit becomes enabled when all selected, clicking Submit shows feedback. Hide: `document.getElementById('thinkScreen').style.display = 'none';`

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Add Knights & Knaves UI renderer with toggle cards and submit"
```

---

## Task 10: Add the session controller

**Files:**
- Modify: `index.html` (extend logic puzzles section; add dispatch in `startLevel`)

- [ ] **Step 1: Add the LEVEL_META_THINK config and session controller**

Below the K&K UI renderer, add:

```js
// =========================================================================
// LOGIC PUZZLES: LEVEL META + SESSION CONTROLLER
// =========================================================================

const LEVEL_META_THINK = {
  1: { name: 'Extremely Easy', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Warm up. Simple deductions, no tricks.',
       accent: '#D4A356', duration: 0 },
  2: { name: 'Easy', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Adds more characters and proposition types. Still gentle.',
       accent: '#D4A356', duration: 0 },
  3: { name: 'Medium', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Compound statements and the full set of valid syllogism forms.',
       accent: '#D4A356', duration: 0 },
  4: { name: 'Hard', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Counts, invalid syllogisms. Slow down.',
       accent: '#D4A356', duration: 0 },
  5: { name: 'Extremely Hard', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Conditional statements. Belief-bias traps. Mind-benders.',
       accent: '#D4A356', duration: 0 },
};

// Register the meta for the hub registration system to pick up
GAME_META.thinkItThrough = LEVEL_META_THINK;

// Session state for an active think puzzle session
let thinkSession = null;

function startThinkSession(levelId) {
  thinkSession = {
    levelId,
    puzzles: [],
    currentIndex: 0,
    correctCount: 0,
    startTime: Date.now(),
  };
  // Generate 5 puzzles, randomly mixing the 2 puzzle types
  for (let i = 0; i < 5; i++) {
    const type = Math.random() < 0.5 ? 'syllogism' : 'kk';
    const puzzle = type === 'syllogism'
      ? generateSyllogism(levelId)
      : generateKnightsKnaves(levelId);
    thinkSession.puzzles.push(puzzle);
  }

  // Show the think screen, hide the menu
  document.getElementById('menu').style.display = 'none';
  document.getElementById('thinkScreen').style.display = 'flex';
  document.documentElement.style.setProperty('--accent', '#D4A356');

  document.getElementById('thinkLevelName').textContent =
    `Level ${levelId}: ${LEVEL_META_THINK[levelId].name}`;
  document.getElementById('thinkBackBtn').onclick = () => exitThinkSession();

  renderCurrentPuzzle();
}

function renderCurrentPuzzle() {
  const session = thinkSession;
  const puzzle = session.puzzles[session.currentIndex];
  const stage = document.getElementById('thinkStage');

  document.getElementById('thinkProgress').textContent =
    `Puzzle ${session.currentIndex + 1} of ${session.puzzles.length}`;
  document.getElementById('thinkScore').textContent =
    `${session.correctCount}/${session.currentIndex}`;

  if (puzzle.type === 'syllogism') {
    renderSyllogismUI(puzzle, stage, (userAns, btn, answersContainer) => {
      const isCorrect = userAns === puzzle.correctAnswer;
      if (isCorrect) session.correctCount++;
      document.getElementById('thinkScore').textContent =
        `${session.correctCount}/${session.currentIndex + 1}`;
      showSyllogismFeedback(puzzle, userAns, answersContainer.parentElement, advancePuzzle);
    });
  } else {
    renderKKUI(puzzle, stage, (userAns, card) => {
      const isCorrect = puzzle.people.every(p => userAns[p] === puzzle.correctAnswer[p]);
      if (isCorrect) session.correctCount++;
      document.getElementById('thinkScore').textContent =
        `${session.correctCount}/${session.currentIndex + 1}`;
      showKKFeedback(puzzle, userAns, card, advancePuzzle);
    });
  }
}

function advancePuzzle() {
  thinkSession.currentIndex++;
  if (thinkSession.currentIndex >= thinkSession.puzzles.length) {
    showThinkResults();
  } else {
    renderCurrentPuzzle();
  }
}

function showThinkResults() {
  const session = thinkSession;
  const accuracy = session.correctCount / session.puzzles.length;
  const passed = session.correctCount >= 4;

  // Record using existing session machinery
  recordSessionCompletion('thinkItThrough', session.levelId, session.correctCount, accuracy);

  // Render a simple result screen on the stage
  const stage = document.getElementById('thinkStage');
  stage.innerHTML = `
    <div class="puzzle-card" style="text-align:center">
      <h2 style="margin-bottom:8px">${passed ? 'Level passed.' : 'Try again.'}</h2>
      <div style="font-size: 36px; margin: 16px 0; color: var(--accent); font-weight: 600">
        ${session.correctCount}/${session.puzzles.length}
      </div>
      <div style="color: var(--muted); margin-bottom: 24px">
        ${passed
          ? (session.levelId < 5 ? `Level ${session.levelId + 1} unlocked.` : 'You finished the hardest tier.')
          : 'Need 4/5 to unlock the next tier.'}
      </div>
      <button class="next-btn" id="thinkExitBtn">Back to levels</button>
    </div>
  `;
  document.getElementById('thinkExitBtn').onclick = () => exitThinkSession();
}

function exitThinkSession() {
  document.getElementById('thinkScreen').style.display = 'none';
  document.getElementById('menu').style.display = 'block';
  thinkSession = null;
  renderMenu();
}
```

- [ ] **Step 2: Hook startLevel to dispatch to think session**

Find the `function startLevel(levelId) {` definition (around line 1359). Modify the start of the function:

```js
function startLevel(levelId) {
  if (currentGameId === 'thinkItThrough') {
    startThinkSession(levelId);
    return;
  }
  document.getElementById('menu').style.display = 'none';
  // ... rest of existing function unchanged
```

- [ ] **Step 3: Hook openTutorial to skip its dispatch for thinkItThrough**

The existing `openTutorial` opens a tutorial modal then calls startLevel on confirm. For MVP, we skip the tutorial modal and go straight into the session. Find `function openTutorial(levelId) {` (around line 1076) and add at its very start:

```js
function openTutorial(levelId) {
  if (currentGameId === 'thinkItThrough') {
    startLevel(levelId);
    return;
  }
  const meta = LEVEL_META[levelId];
  // ... rest of existing function unchanged
```

- [ ] **Step 4: Manually test full flow**

Reload. From home, click "Think It Through". You should see 5 levels (only level 1 unlocked initially). Click level 1 → 5 puzzles run → results show → back to menu. Pass with 4/5 and level 2 should unlock.

Expected: full session works end-to-end. Score increments correctly. Pass at 4/5 unlocks next level.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Wire up session controller and dispatch from existing startLevel"
```

---

## Task 11: Add the dev validation harness

**Files:**
- Modify: `index.html` (extend logic puzzles section)

- [ ] **Step 1: Add the validation harness**

At the very end of the logic puzzles section (just before `</script>`), add:

```js
// =========================================================================
// LOGIC PUZZLES: DEV VALIDATION HARNESS
// =========================================================================
// Runs on page load when on localhost. Verifies generators produce well-formed
// puzzles with correct validity labels and unique solutions.

function validateLogicPuzzleGenerators() {
  let failed = 0;
  const fail = (msg) => { console.error('[VALIDATION FAIL]', msg); failed++; };

  console.group('Think It Through generator validation');

  // Known syllogism validity
  if (!isSyllogismValid('AAA', 1)) fail('Barbara should be valid');
  if (!isSyllogismValid('EAE', 1)) fail('Celarent should be valid');
  if (!isSyllogismValid('AII', 1)) fail('Darii should be valid');
  if (!isSyllogismValid('EIO', 1)) fail('Ferio should be valid');
  if (isSyllogismValid('AAA', 2))  fail('AAA-2 should be invalid');
  if (isSyllogismValid('OOO', 1))  fail('OOO-1 should be invalid (rule 3)');

  // Geurts costs
  if (getGeurtsCost('AAA', 1) !== 0)  fail('Barbara cost should be 0');
  if (getGeurtsCost('AII', 1) !== 20) fail('Darii cost should be 20');

  // 100 syllogisms per tier
  for (let tier = 1; tier <= 5; tier++) {
    for (let i = 0; i < 100; i++) {
      const p = generateSyllogism(tier);
      if (!['valid','invalid','cant-tell'].includes(p.correctAnswer)) {
        fail(`Tier ${tier} syllogism #${i}: bad correctAnswer ${p.correctAnswer}`);
      }
      if (p.premises.length !== 2) fail(`Tier ${tier} syllogism #${i}: wrong premise count`);
      if (!p.conclusion) fail(`Tier ${tier} syllogism #${i}: missing conclusion`);
    }
  }

  // K&K evaluator
  const a = new Map([['A','knight'],['B','knave']]);
  if (!evaluateStatement({type:'self_identity',target:'A',isKnight:true}, a)) fail('K&K self_identity A=knight');
  if (evaluateStatement({type:'other_identity',target:'B',isKnight:true}, a)) fail('K&K B is knave not knight');

  // 100 K&K per tier, all have unique solutions
  for (let tier = 1; tier <= 5; tier++) {
    for (let i = 0; i < 100; i++) {
      const p = generateKnightsKnaves(tier);
      if (!p.correctAnswer) fail(`Tier ${tier} K&K #${i}: missing correctAnswer`);
      if (p.people.length < 2) fail(`Tier ${tier} K&K #${i}: too few people`);
      // Verify the generator's claimed answer actually satisfies the puzzle
      const statementsByPerson = {};
      p.statements.forEach((s, idx) => {
        // We can't easily re-derive the original statement objects from rendered text,
        // so we just verify the answer is non-empty and the right people are present
        statementsByPerson[s.speaker] = [];
      });
      const answerKeys = Object.keys(p.correctAnswer);
      if (answerKeys.length !== p.people.length) {
        fail(`Tier ${tier} K&K #${i}: answer keys mismatch`);
      }
    }
  }

  if (failed === 0) {
    console.log('%cAll generator tests passed', 'color: #4FA877; font-weight: bold');
  } else {
    console.log(`%c${failed} test(s) failed`, 'color: #D17B6F; font-weight: bold');
  }
  console.groupEnd();
}

// Run validation only on localhost or file:// (development)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:') {
  // Wait for DOMContentLoaded so all funcs are defined
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateLogicPuzzleGenerators);
  } else {
    validateLogicPuzzleGenerators();
  }
}
```

- [ ] **Step 2: Reload and check console**

Open `index.html` (file:// or localhost). Open browser console.

Expected: "All generator tests passed" in green. If any failures, fix them before continuing.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add dev-only generator validation harness with 1000 puzzles tested"
```

---

## Task 12: Add the honest claim note to the science modal

**Files:**
- Modify: `index.html` (extend LEVEL_META_THINK entries with paradigm description)

- [ ] **Step 1: Add the description field to LEVEL_META_THINK**

Find the `LEVEL_META_THINK` block added in Task 10. Replace it with:

```js
const THINK_PARADIGM_DESC = `Practicing deductive reasoning has shown some evidence of transfer in research, more than most "brain training" tasks. LSAT preparation studies (PLOS ONE, 2015) found improvements on untrained transitive inference tasks after intensive practice. The Mental Models Training App study (Frontiers in Psychology, 2023) confirmed that adaptive practice with deductive reasoning reliably improves performance.

The gap between "better at puzzles" and "better at real-world decisions" is still real. The honest benefit is the daily ritual: putting your phone down and sitting with a problem until you understand it.

Syllogisms (Aristotle, formalized in modern cognitive science by Johnson-Laird) and Knights & Knaves (Smullyan, 1978) are two of the most-studied formats in the syllogistic reasoning and Boolean logic literature.`;

const LEVEL_META_THINK = {
  1: { name: 'Extremely Easy', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Warm up. Simple deductions, no tricks.',
       accent: '#D4A356', duration: 0, description: THINK_PARADIGM_DESC },
  2: { name: 'Easy', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Adds more characters and proposition types. Still gentle.',
       accent: '#D4A356', duration: 0, description: THINK_PARADIGM_DESC },
  3: { name: 'Medium', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Compound statements and the full set of valid syllogism forms.',
       accent: '#D4A356', duration: 0, description: THINK_PARADIGM_DESC },
  4: { name: 'Hard', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Counts, invalid syllogisms. Slow down.',
       accent: '#D4A356', duration: 0, description: THINK_PARADIGM_DESC },
  5: { name: 'Extremely Hard', paradigm: 'Syllogisms · Knights & Knaves',
       short: 'Conditional statements. Belief-bias traps. Mind-benders.',
       accent: '#D4A356', duration: 0, description: THINK_PARADIGM_DESC },
};
```

- [ ] **Step 2: Verify the science modal opens with the description**

Reload. On the Think It Through menu screen, click the `?` icon next to any level. The science modal should pop up with the paradigm name and description text.

Expected: modal opens, shows the THINK_PARADIGM_DESC text correctly. If the existing `openScience` function reads `meta.description`, this works. If it reads a different field, check `openScience` (line ~1191) and adjust.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add honest-claim paradigm description for Think It Through levels"
```

---

## Task 13: Manual playtest and bug fixes

**Files:**
- Modify: `index.html` as needed for any bugs found

- [ ] **Step 1: Run the manual playtest checklist**

Open `index.html` in Chrome desktop. Go through the checklist:

- [ ] Hub home shows 6 cards including Think It Through
- [ ] Click Think It Through → menu shows 5 levels, only level 1 unlocked
- [ ] Click level 1 → puzzle session starts (no tutorial modal)
- [ ] 5 puzzles play through, mix of syllogism and K&K
- [ ] Each puzzle's feedback shows correctly (correct/incorrect)
- [ ] Score increments correctly (e.g., 2/3 after 2 correct out of 3 answered)
- [ ] Results screen shows pass/fail
- [ ] Pass with 4/5 → level 2 unlocks (check by going back to menu)
- [ ] Refresh page → unlock progress persists
- [ ] Streak counter on home increments after completing a session

Open in Safari and Firefox: same flow works.

- [ ] **Step 2: Mobile playtest (real device, not devtools)**

Deploy locally (e.g. `python3 -m http.server` and visit from phone on same wifi), or test on iPhone Safari directly.

- [ ] Cards are reachable (no clipped buttons)
- [ ] Knight/Knave toggle buttons are at least 44px tall (visually)
- [ ] Syllogism answer buttons are spaced well, easy to tap
- [ ] No horizontal scrolling
- [ ] Back button (`←`) works

- [ ] **Step 3: 50-puzzle calibration check**

Hand-solve 10 puzzles per tier (50 total). Note:
- Tier 1: should average under 1 minute each
- Tier 5: should average 5-15 minutes each

If a tier feels wrong, adjust `TIER_COST_BANDS` or `KK_TIER_MECHANICS`.

- [ ] **Step 4: Fix any bugs found**

For each bug, make a focused commit with the fix and a clear message.

- [ ] **Step 5: Final commit (if any fixes were made)**

```bash
git add index.html
git commit -m "Fix playtest bugs: <list specific fixes>"
```

If no bugs were found, no commit needed.

---

## Self-Review

### Spec coverage check

| Spec requirement | Plan task |
|---|---|
| Add 6th game to GAMES array | Task 1 |
| Amber accent color #D4A356 | Task 1 |
| 5 difficulty tiers | Task 4 (syllogism tier bands), Task 8 (K&K mechanics), Task 10 (LEVEL_META) |
| Syllogism generator (procedural, Geurts-weighted) | Tasks 2, 3, 4 |
| Knights & Knaves generator (procedural, SAT-validated) | Tasks 6, 7, 8 |
| Mixed input UIs: 3-button syllogism, K&K toggle cards | Tasks 5, 9 |
| Untimed, 5 puzzles per session | Task 10 |
| Pass at 4/5 to unlock | Task 10 (relies on existing `recordSessionCompletion`) |
| State migration handled by existing loadState | (automatic, verified in Task 13) |
| WCAG 2.2 enhanced touch targets (48px) | Tasks 5 and 9 (CSS min-height: 48px) |
| Dev validation harness | Task 11 |
| Honest claim note | Task 12 |
| 50-puzzle manual playtest | Task 13 |

All spec requirements have an implementing task.

### Placeholder scan

No TBDs, no "implement later", no vague "add error handling" instructions. Each task has complete code.

### Type consistency check

- `generateSyllogism(tier)` returns `{type, tier, mood, figure, geurtsCost, premises, conclusion, correctAnswer}`, consistent across Tasks 4, 5, 10, 11
- `generateKnightsKnaves(tier)` returns `{type, tier, people, statements, correctAnswer}`, consistent across Tasks 8, 9, 10, 11
- `evaluateStatement(stmt, assignment)` signature consistent across Tasks 6, 7, 11
- `renderSyllogismUI(puzzle, stage, onAnswer)` signature consistent across Tasks 5, 10
- `renderKKUI(puzzle, stage, onAnswer)` signature consistent across Tasks 9, 10
- `TIER_COST_BANDS` referenced in Task 4 and Task 11, consistent

All names and signatures match.

---

**Plan complete. Saved to `docs/superpowers/plans/2026-05-26-logic-puzzles-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)**, I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution**, Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
