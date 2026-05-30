# Modal Scroll + Accessibility Fix — Implementation Plan

**Goal:** Make all five popups (stats, settings, tutorial, science, results) scroll within the viewport and behave as proper accessible dialogs, so content and close controls are always reachable.

**Architecture:** Single static `index.html`. Fix is (1) CSS so each `.modal` caps its height and scrolls internally, (2) a small centralized JS controller giving every modal Escape-to-close, tap-outside-to-close, focus move/trap/return, and iOS-safe background scroll-lock, (3) ARIA dialog markup, (4) larger tap targets on the home meta buttons. No build step; verification is in-browser via the preview tools at 375x667, 375x812, and desktop.

**Tech stack:** Vanilla HTML/CSS/JS. Grounded in W3C ARIA APG dialog pattern, WCAG 2.2 (2.5.8 target size), CSS `dvh` units (iOS 15.4+), and the fixed-body scroll-lock technique (reliable on iOS Safari).

---

## Decisions (from research)
- **Cap + scroll the modal, don't move it:** `max-height: calc(100dvh - 48px); overflow-y:auto; overscroll-behavior:contain` on `.modal`. `dvh` (dynamic viewport) avoids the iOS Safari toolbar cutting off the bottom; `vh` line first as fallback. 48px = the existing `.modal-bg` 24px top+bottom padding.
- **Scroll-lock = fixed-body technique:** `overflow:hidden` on body is ignored by iOS Safari; instead store `scrollY`, set `body{position:fixed;top:-y;width:100%}`, restore with `scrollTo` on close. Lock on first modal open, unlock on last close.
- **Centralize:** route every existing `classList.add/remove('active')` for the 5 modals through `showModalEl`/`hideModalEl` so lock/focus are consistent.
- **Tap targets:** home meta buttons are 20px tall (< WCAG 2.5.8 AA 24px). Bump via padding while keeping the text-link look; accept this is below the 44px AAA target to preserve the minimal aesthetic.

## File structure
- Modify: `index.html` (CSS `<style>` block + JS `<script>` block).
- Create: this plan doc.

---

### Task 1: CSS — make modals scroll, enlarge tap targets

- [ ] In `.modal { max-width:520px; ... padding:32px; }` add height cap + scroll:
```css
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  overflow-y: auto;
  overscroll-behavior: contain;
```
- [ ] `.meta { display:flex; gap:24px; ... }` → add `align-items: center;`
- [ ] `.meta button.audio-toggle { ... padding: 0; }` → `padding: 11px 4px 5px;` and add `min-height: 34px; line-height: 1.2;` (keeps dotted underline near text, raises hit area to ~34px ≥ 24px AA).

### Task 2: HTML — ARIA dialog markup

For each modal's `.modal` div add `role="dialog" aria-modal="true" tabindex="-1" aria-labelledby="<headingId>"`:
- [ ] stats `<div class="modal modal-wide">` → labelledby `statsTitle`; add `id="statsTitle"` to its `<h2>Your stats</h2>`.
- [ ] settings `<div class="modal">` (the one with `<h2>Settings</h2>`) → labelledby `settingsTitle`; add `id="settingsTitle"`.
- [ ] tutorial `.modal` → labelledby `tutTitle` (id exists).
- [ ] science `.modal` → labelledby `sciTitle` (id exists).
- [ ] results `.modal` → labelledby `resTitle` (id exists).

### Task 3: JS — centralized modal controller

- [ ] Insert before the `// INIT` section (after the reset-button wiring, before `renderHome();`):
```js
// --- Modal a11y controller: scroll-lock, focus, Escape, backdrop click ---
let _modalScrollY = 0, _modalReturnFocus = null;
function _lockBg(){ _modalScrollY = window.scrollY || 0; const b=document.body.style;
  b.position='fixed'; b.top=`-${_modalScrollY}px`; b.left='0'; b.right='0'; b.width='100%'; }
function _unlockBg(){ const b=document.body.style;
  b.position=''; b.top=''; b.left=''; b.right=''; b.width=''; window.scrollTo(0, _modalScrollY); }
function showModalEl(id){
  const bg = typeof id==='string' ? document.getElementById(id) : id;
  const firstOpen = !document.querySelector('.modal-bg.active');
  _modalReturnFocus = document.activeElement;
  bg.classList.add('active');
  if (firstOpen) _lockBg();
  const dlg = bg.querySelector('.modal');
  if (dlg && dlg.focus) dlg.focus();
}
function hideModalEl(id){
  const bg = typeof id==='string' ? document.getElementById(id) : id;
  bg.classList.remove('active');
  if (!document.querySelector('.modal-bg.active')) _unlockBg();
  if (_modalReturnFocus && _modalReturnFocus.focus){ try { _modalReturnFocus.focus(); } catch(e){} _modalReturnFocus = null; }
}
document.addEventListener('keydown', (e) => {
  const open = document.querySelectorAll('.modal-bg.active');
  if (!open.length) return;
  const bg = open[open.length - 1];
  if (e.key === 'Escape'){ e.preventDefault(); hideModalEl(bg); return; }
  if (e.key === 'Tab'){
    const f = [...bg.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(el => el.offsetParent !== null);
    if (!f.length){ e.preventDefault(); return; }
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    else if (!bg.contains(document.activeElement)){ e.preventDefault(); first.focus(); }
  }
});
document.querySelectorAll('.modal-bg').forEach(bg => {
  bg.addEventListener('mousedown', (e) => { if (e.target === bg) hideModalEl(bg); });
});
```

### Task 4: JS — route opens/closes through the controller

- [ ] openStats: `...('statsModal').classList.add('active');` → `showModalEl('statsModal');`
- [ ] closeStats body → `hideModalEl('statsModal');`
- [ ] openSettings add → `showModalEl('settingsModal');`
- [ ] closeSettings body → `hideModalEl('settingsModal');`
- [ ] openTutorial add → `showModalEl('tutorialModal');`; onStart & onCancel removes → `hideModalEl('tutorialModal');`
- [ ] openScience add → `showModalEl('scienceModal');`; sciClose handler remove → `hideModalEl('scienceModal');`
- [ ] showResults add → `showModalEl('resultsModal');`; close() remove → `hideModalEl('resultsModal');`

### Task 5: Verify in browser (preview tools)
- [ ] Reload, clear storage. No console errors.
- [ ] At 375x667, 375x812, desktop: open each modal → measure `fits` (top>=0 && bottom<=vh) OR internally scrollable; both close controls reachable.
- [ ] Stats: scroll inside to the bottom Close; title visible at top on open.
- [ ] Escape closes; mousedown on backdrop closes; focus moves into modal on open and returns to trigger on close.
- [ ] Background does not scroll while a modal is open (fixed-body); scroll position restored on close.
- [ ] Tap targets: home Audio/Stats/Settings >= 24px tall.
- [ ] Regression: normal nav (home → game menu → tutorial → start; results → menu) still works; reduced-motion / text-size settings still apply.

## Self-review check
- Spec coverage: P0 scroll (T1), P1 escape/backdrop/scroll-lock (T3+T4), P2 ARIA/focus (T2+T3) + tap targets (T1). Covered.
- Names consistent: `showModalEl`/`hideModalEl`/`_lockBg`/`_unlockBg` used identically across tasks.
- No placeholders: all code is literal.
