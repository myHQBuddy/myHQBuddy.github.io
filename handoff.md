# myHQ T&D — Session Handoff

**Project:** myHQ Buddy — Sales L&D platform on GitHub Pages (krrishmyhq/myHQBuddy)
**Working directory:** `/Users/krrishbhandari/Desktop/ch2_manojsir/`
**Stack:** Firebase v9 compat (Auth + Firestore), static HTML/CSS/JS on GitHub Pages

---

## Key Files

| File | Purpose |
|------|---------|
| `admin.html` | Admin portal — content editing, draft/review/push workflow |
| `Who_We_Are_v2.html` | Chapter 2 viewer (slides + chapter content + assessment) |
| `Where_We_Play_v2.html` | Chapter 1 viewer |
| `hub.html` | Course hub for learners |
| `landing.html` | Login/landing page |
| `firebase-config.js` | Firebase init (shared) |

---

## Firestore Structure

- `content/{chId}` — live content doc (e.g. `ch2`)
- `content-drafts/{chId}` — pending draft; has `_draftStatus: 'pending'`
- `users/{uid}` — user doc with `isAdmin`, `masterAdmin` booleans

---

## Admin Architecture

### CHAPTER_DEFS
Defined in `admin.html` (~line 400). Each chapter has:
```js
CHAPTER_DEFS['ch2'] = {
  label: 'Who We Are',
  slideFields: [...],   // visual slide text fields
  contentFields: [...], // reading sections
  assessFields: [...]   // assessment questions
}
```

Each field object:
```js
{ id: 'field-id', label: 'Display Label', type: 'input'|'textarea', group: 'Group Header', default: '...', html: true /* optional */ }
```

- `html: true` → field stores raw HTML (not stripped), rendered with `innerHTML` in viewer and shown as monospace textarea in admin
- All other fields → stored as plain text, `stripHtml()` applied on load, rendered with `textContent` in viewer

### 3 Sub-tabs
- **Slide Content** → `slideFields` — visual slide text
- **Chapter Content** → `contentFields` — reading sections
- **Assessment** → `assessFields` — questions

### Draft Lifecycle
1. Editor types → `saveDraft()` → writes to `content-drafts/{chId}`
2. Submit → sets `_draftStatus: 'pending'`
3. Master admin sees "Review Changes" badge → `showDiff()` opens diff view
4. Per-field Accept/Reject → `pushLive()` writes accepted fields to `content/{chId}`, deletes draft

### Key State Variables (in-memory)
- `liveData` — current Firestore `content/{chId}` doc
- `draftData` — fields that differ from live (subset of draft doc)
- `fieldAccepted` — `{ fieldId: null|true|false }` — null=pending, true=accepted, false=rejected
- `changedFields` — Set of field IDs with differences
- `pillStatuses` — `{ chId: { hasDraft: bool, draftStatus: 'pending'|null } }`
- `isMasterAdmin` — boolean, gates review UI
- `currentChapterId`, `currentEditTab`

---

## Viewer Rendering (Who_We_Are_v2.html & Where_We_Play_v2.html)

Firebase renderer at bottom of each file (~line 2200 in Who_We_Are_v2.html):
```js
document.querySelectorAll('[data-editable]').forEach(function(el) {
  var key = el.getAttribute('data-editable');
  var val = cData[key];
  if (val === undefined) return;
  if (key.indexOf('-body') !== -1 || key.indexOf('-outcome') !== -1 || el.getAttribute('data-editable-html') === 'true') {
    el.innerHTML = val;  // HTML rendering for rich content
  } else {
    el.textContent = String(val).replace(/<[^>]*>/g, '');  // plain text, strip any stale HTML
  }
});
```

**Rules:**
- Keys ending in `-body` or `-outcome` → `innerHTML`
- Elements with `data-editable-html="true"` → `innerHTML`
- Everything else → `textContent` (strips HTML)

---

## What Was Done This Session

### 1. Story Timeline — now editable
All 11 `btl-item` entries in the Who We Are Chapter Content (S01 — The Story) now have `data-editable`:
- `ch2-tl1-year` through `ch2-tl11-year` — on `.btl-year` divs
- `ch2-tl1-title` through `ch2-tl11-title` — on `.btl-title` divs
- `ch2-tl1-body` through `ch2-tl11-body` — on `.btl-body` divs (use `-body` suffix → `innerHTML` rendering, so `<strong>` and `<a>` tags render correctly)

Corresponding fields added to `admin.html` ch2 `contentFields` under group `S01 — Timeline Entries`.

### 2. Slide Headlines — decorative spans/breaks restored
These fields have `html: true` in CHAPTER_DEFS and `data-editable-html="true"` in the HTML:
- `ch2-sl1-headline` — `<span style="color:var(--blue)">underutilised real estate</span><br>`
- `ch2-sl2-headline` — `<span style="color:var(--blue)">scaled and evolved</span><br>`
- `ch2-sl3-headline` — `<span style="color:var(--blue)">reimagined</span><br>`
- `ch2-sl3-vision` — `<strong>any-where</strong>` and `<strong>any-way</strong>`
- `ch2-sl4-sub` — `<br>` line break mid-text
- `ch2-sl8-headline` — `<span style="color:var(--blue)">₹5,000 Cr</span>` and `<span style="color:var(--blue)">₹500 Cr</span><br>`

In admin.html, `html: true` fields:
- Are NOT passed through `stripHtml()` on load (uses `htmlFieldIds` Set)
- Shown as monospace textarea with "HTML" badge in edit panel
- Stored with raw HTML in Firestore, rendered with `innerHTML` in viewer

### 3. Missing Chapter Content body fields — fixed
Added `data-editable` to previously missing section body elements in `Who_We_Are_v2.html`:
- `ch2-s02-body` — Business Verticals intro paragraph (wrapped in `<div>`)
- `ch2-s02-body2` — Business Verticals closing paragraph (after the cards grid)
- `ch2-s04-body` — Org Structure body `<p>` (~line 1600)
- `ch2-s05-body` — Scale & Reach body `<p>` (~line 1796)
- `ch2-s06-body` — Ambition 2030 body (wrapped in `<div>` around 2 `<p>` tags)
- `ch2-s07-body` — Success Stories tagline `<p>`

Corresponding fields added to `admin.html` ch2 `contentFields` for S02–S07 groups.

---

## Known Issues / Not Yet Verified

- **New Firestore fields not yet seeded** — the 33 new timeline fields (`ch2-tl1-*` through `ch2-tl11-*`) and new body fields will be auto-seeded from defaults when any admin opens ch2 for the first time (the `loadChapter` function does `set(missing, { merge: true })` for undefined fields). No manual action needed.
- **Existing Firestore data for html fields** — `ch2-sl1-headline` etc. may currently be stored as plain text (user edited them to remove spans in a prior session). On next admin open, the old plain-text value will be loaded and shown in the HTML textarea. The admin will need to re-add the HTML formatting if they want the decorative spans in the slide. The static HTML default in the file will show until Firebase overrides it.
- **`ch2-sl2-t3-title`** in the slide has `<br>` in the HTML source (`Virtual Office<br>Launched`) — this is a slide timeline node title, stored as plain text, rendered with `textContent`. The `<br>` is therefore NOT rendered. This was pre-existing and not yet fixed.

---

## Admin HTML Key Function Locations

| Function | ~Line | Purpose |
|----------|-------|---------|
| `loadChapter(chId)` | 970 | Loads live + draft, builds htmlFieldIds, seeds defaults |
| `renderEditFields()` | 1100 | Renders edit form for current tab |
| `saveDraft()` | 1146 | Saves all field values to content-drafts |
| `showDiff()` | 1166 | Shows accept/reject diff view |
| `pushLive()` | ~1280 | Writes accepted fields to content, deletes draft |
| `rejectAllFields()` | ~1320 | Clears draft, returns to editor |
| `refreshPillStatuses()` | ~1360 | Checks all chapters for real draft differences |
| `stripHtml(str)` | 1087 | Strips HTML tags from string |
| `escHtml(str)` | 1084 | Escapes HTML for safe insertion into HTML |

---

## Pending / Possible Next Tasks

1. Test the new timeline fields end-to-end in browser (open ch2 in admin, check S01 — Timeline Entries group appears with all 11 entries)
2. Verify decorative headline spans show in the slides before Firebase load (static HTML) and after Firebase load (innerHTML rendering)
3. Check `ch2-sl2-t3-title` `<br>` — either move the line break to a CSS approach or accept it as-is
4. Possibly add `data-editable` to the s04 org chart word-from-leaders section body (~line 1697)
5. Where We Play (ch1) — verify all slide fields still work after previous session changes
