# myHQ Buddy

An internal learning platform for myHQ — a structured, chapter-based onboarding experience that helps new joinees understand the business, the market, and the local landscape through interactive slide decks, self-paced read mode, reflection questions, and per-user progress tracking.

Hosted on GitHub Pages: **myHQBuddy.github.io**

---

## Architecture at a glance

The app is a set of static HTML pages backed by two services:

| System | Role |
|--------|------|
| **Firebase Auth** | Google SSO sign-in (restricted to `@myhq.in`), session management |
| **Firebase Firestore** | Source of truth for everything dynamic: user records, chapter unlock state, per-chapter completion, and editable chapter content |
| **Google Apps Script + Sheets/Drive** | Permanent record of submitted answers (response sheets, Google Docs, file uploads) |

Firestore is the source of truth for **access control and content**. Apps Script is the **record of answers and uploads**. Both are written on submission.

- **Firebase config:** `firebase-config.js` — loaded on every page. Holds the project config, initialises `window.firebaseAuth` / `window.firebaseDB`, enforces the `@myhq.in` restriction, and seeds the master-admin flag.
- **Apps Script URL (shared by all chapters):** `https://script.google.com/macros/s/AKfycbwX0Z5vx6DSwdwZwK26pKZL3V3U9XwEyWgPa9Ek_cFEH1_tpULnWNcn7RlgE-wT8M9M/exec` — source in `Code.gs`.
- **Firebase project:** `myhq-td-fcf03`.
- **Master admin:** `rohit.bagga@myhq.in` (set as `masterAdmin: true` automatically on first sign-in).

---

## Pages

| File | Description |
|------|-------------|
| `landing.html` | Sign-in page (Google SSO). Ensures `ch1` is unlocked for every user. |
| `hub.html` | Course hub — shows each chapter's lock / unlocked / completed state and handles the auto-unlock chain. |
| `Where_We_Play_v2.html` | **ch1** — Where We Play: India's commercial real estate market. |
| `Who_We_Are_v2.html` | **ch2** — Who We Are: myHQ's story, team & ambition. |
| `Know_Your_City.html` | **amch1** — Know Your City: geography, micromarkets, local expertise (AM track). |
| `Know_Your_Spaces.html` | **amch2** — Know Your Spaces: operators, inventory, brand analysis (self-read AM chapter). |
| `admin.html` | Admin dashboard — lock/unlock chapters per user, edit chapter content, view all users. |

> Note: `chapter-2.html`, `Coworking & Flex.html`, `index.html` are legacy/standalone and not part of the live flow.

---

## Firestore data model

### `users/{uid}` — one doc per user, keyed by Firebase UID

```
users/{uid}
  name:        string      — first name from Google account
  email:       string      — full @myhq.in email
  lastLogin:   timestamp   — updated on every sign-in
  masterAdmin: boolean     — true only for rohit.bagga@myhq.in
  isAdmin:     boolean      — true for delegated admins (toggled by master admin)
  unlockedChapters: {
    beginner: string[]     — chapter IDs the user can open, e.g. ['ch1','ch2','amch1','amch2']
  }
  progress: {
    ch1:   { completed: bool, completedAt: timestamp }
    ch2:   { completed: bool, completedAt: timestamp }
    amch1: { completed: bool, completedAt: timestamp }
    amch2: { completed: bool, completedAt: timestamp }
  }
```

`unlockedChapters` controls **access**; `progress` records **completion**. They are separate on purpose — a chapter can be unlocked but not yet completed.

### `content/{chapterId}` — live editable copy per chapter

```
content/ch1, content/ch2, content/amch1, content/amch2
  <fieldId>: string   — keyed by the data-editable attribute used in the chapter HTML
```

Each chapter HTML has `data-editable="<fieldId>"` attributes on editable elements. On load, the chapter reads `content/{chapterId}` and overwrites the matching elements' `innerHTML`. If a field is absent, the hardcoded HTML default is shown.

### `content-drafts/{chapterId}` — staged edits awaiting publish

```
content-drafts/ch1, ...
  <fieldId>: string
  _draftStatus: 'pending'
```

Admin edits land here first; the master admin reviews and publishes diffs into `content/{chapterId}` (see **Editing chapter content**).

---

## Login / auth flow

1. User opens `landing.html` → clicks **Sign in with Google** → `signInWithGoogle()` calls `auth.signInWithPopup()` with `hd: 'myhq.in'`.
2. `onAuthStateChanged` in `firebase-config.js` fires on every page:
   - Any non-`@myhq.in` email is immediately signed out.
   - Upserts `users/{uid}` (`name`, `email`, `lastLogin`).
   - Sets `masterAdmin: true` for `rohit.bagga@myhq.in`.
3. `onAuthStateChanged` in `landing.html` also fires:
   - Shows the admin portal link if `isAdmin` / `masterAdmin`.
   - Ensures `ch1` is in `unlockedChapters.beginner` (via `arrayUnion('ch1')`) so every user starts with Chapter 1.
4. User proceeds to `hub.html`.

Every protected page re-checks `onAuthStateChanged` and redirects to `landing.html` if there is no user.

---

## Chapter unlock chain (auto-unlock)

Unlock is **automatic** — completing a chapter unlocks the next without admin action. The master admin can still override any chapter for any user.

The chain, all driven by `arrayUnion` writes to `unlockedChapters.beginner`:

1. **Sign in** → `ch1` unlocked (`landing.html`).
2. **Submit Where We Play (ch1)** → `progress.ch1.completed = true` **and** `ch2` unlocked.
3. **Submit Who We Are (ch2)** → `progress.ch2.completed = true` **and** `amch1` + `amch2` unlocked.
4. **Submit Know Your City (amch1)** → `progress.amch1.completed = true`.
5. **Submit Know Your Spaces (amch2)** → `progress.amch2.completed = true`.

`hub.html` also has a safety net: if both org chapters (`ch1` + `ch2`) are completed but the AM chapters aren't yet in `unlockedChapters`, it writes them via `arrayUnion` on load. Each chapter page independently gates access — if its `CHAPTER_ID` isn't in `unlockedChapters.beginner`, it renders a 🔒 lock screen instead of the content.

> Know Your Spaces (amch2) is a self-read chapter not presented to new joinees, so auto-unlocking it alongside amch1 is intentional.

---

## Chapter submission flow

On **Submit** in any chapter (`submitAssessment` / equivalent):

1. Validate all questions answered (and minimum word counts where applicable).
2. Read name/email from **`firebaseAuth.currentUser`** (`displayName` / `email`), falling back to `localStorage`. *Do not rely on localStorage alone — it is never set for fresh Firebase sessions and produces blank answer docs.*
3. Write completion + unlock to Firestore:
   ```js
   db.collection('users').doc(uid).update({
     'progress.ch2.completed': true,
     'progress.ch2.completedAt': firebase.firestore.FieldValue.serverTimestamp()
   });
   db.collection('users').doc(uid).set({
     unlockedChapters: { beginner: firebase.firestore.FieldValue.arrayUnion('amch1','amch2') }
   }, { merge: true });
   ```
4. POST answers to the Apps Script URL (`mode:'no-cors'`, `Content-Type:'text/plain'` to avoid CORS preflight):
   ```json
   { "chapter":"Chapter 2", "chapterName":"Who We Are", "status":"Completed",
     "name":"…", "email":"…", "timestamp":"…", "q1":"…", "q2":"…" }
   ```
   Apps Script `doPost` appends a row to the `Who We Are Responses` sheet (auto-created) and updates the `User Progress` sheet.
5. POST a second `action:'saveAnswersDoc'` request so Apps Script writes a formatted Google Doc of the Q&A into the chapter's Drive folder.

AM chapters (Know Your City / Know Your Spaces) additionally upload presentation/audio/tracker files to Drive via `action:'uploadFile'` with a per-task `folderPath`.

---

## Apps Script (`Code.gs`) reference

`doPost` actions (sent as JSON in the body):

| `action` | Purpose |
|----------|---------|
| *(none)* | Append a response row to `[chapterName] Responses` + update `User Progress`. |
| `saveAnswersDoc` | Create a formatted Google Doc of the user's answers in `folderPath`. |
| `uploadFile` | Upload a base64 file into a Drive folder (used by AM chapters). |

`doGet` actions:

| `?action=` | Purpose |
|------------|---------|
| `admin` | Returns all users + completion status (key `myHQBuddyadmin`). |
| `debug` | Lists sheet names (dev only). |
| `login`, `loginWithProgress`, `getProgress` | **Legacy** — predate Firebase Auth, no longer called by any page. |

Drive root folder ID: `1rtaqTqSJlRJ7HmOrlObgjKxmmomHO_8b`. Folder paths are `/`-separated and auto-created.

---

## Admin: locking & unlocking chapters

`admin.html` is gated to `isAdmin` / `masterAdmin` users (others are bounced to `hub.html`).

- Pick a user → pick a course (Beginner / Intermediate / Advanced) → the chapter list renders from the `COURSES` constant.
- Each chapter shows a **Locked / Unlocked** pill. `toggleChapter()` adds/removes the chapter ID from `users/{uid}.unlockedChapters.<course>`.
- This is a manual override on top of the automatic chain — admins can unlock ahead or re-lock a chapter at will.
- The master admin can also promote/demote other users to `isAdmin`.

---

## Admin: editing chapter content (draft → publish)

Chapter copy is editable without touching code, through a draft-and-approve workflow:

1. Admin opens a chapter in `admin.html`. Fields come from `CHAPTER_DEFS[chapterId]` (`slideFields`, `contentFields`, `assessFields`), pre-filled from the live `content/{chapterId}` doc (or HTML defaults).
2. **Save draft** → writes edited fields to `content-drafts/{chapterId}` with `_draftStatus: 'pending'`. Nothing is live yet.
3. The **master admin** reviews via the diff view (`showDiff`) — LIVE vs DRAFT side by side, accepting/rejecting/editing each changed field.
4. **Publish** accepted fields → merged into `content/{chapterId}`. The draft is cleared (or trimmed to remaining pending fields).
5. Chapter pages read `content/{chapterId}` on load and apply values to `[data-editable]` elements — changes appear immediately for users.

> Keep `data-editable` IDs in the chapter HTML in sync with the field IDs in `CHAPTER_DEFS`. A mismatch means the field can be edited in admin but won't appear in the chapter (or vice versa).

---

## Slide scaling & browser zoom

Slide-deck chapters render on a fixed **1440×900** canvas (`#slides`) scaled to the viewport by `scaleSlides()`. The required zoom behaviour (the user-confirmed standard for all current and future chapters):

- **Browser zoom-in magnifies the slide** (content gets bigger) and the page scrolls to reach overflow — matching the natively-zoomed topbar. It is *not* fit-to-window-on-zoom.
- Achieved by capturing `BASE_DPR = devicePixelRatio` at load, then `scale = fit × (devicePixelRatio / BASE_DPR)`, clamping offsets to ≥ 0, growing `document.body` min-height/width so overflow is scrollable, and re-running on `matchMedia('(resolution: …dppx)')` change.
- CSS: `body { overflow: auto }`, `.slides { position: absolute; transform-origin: top left }`. All in-canvas sizing uses fixed `px` (no `vw`/`clamp()`), since `vw` inside `transform: scale()` resolves against the real viewport, not the canvas.

Apply this exact `scaleSlides()` pattern to every new slide-deck chapter. (Know Your Spaces is a scrolling self-read chapter and has no `.slides` canvas.)

---

## Adding a new chapter

1. **Build the chapter HTML** — copy an existing chapter (e.g. `Who_We_Are_v2.html`) so you inherit the auth gate, the `scaleSlides()` zoom logic, and the submission scaffold.
2. **Set the chapter ID** — `var CHAPTER_ID = 'amch3';` (matching the ID used everywhere below). The page gates access on `unlockedChapters.beginner` containing this ID.
3. **Tag editable copy** — add `data-editable="amch3-…"` attributes to any element admins should be able to edit.
4. **On submit, write Firestore:**
   ```js
   db.collection('users').doc(uid).update({
     'progress.amch3.completed': true,
     'progress.amch3.completedAt': firebase.firestore.FieldValue.serverTimestamp()
   });
   // Unlock the NEXT chapter in the chain:
   db.collection('users').doc(uid).set({
     unlockedChapters: { beginner: firebase.firestore.FieldValue.arrayUnion('amch4') }
   }, { merge: true });
   ```
5. **POST answers** to the shared Apps Script URL with `chapterName` set to the title — the `[chapterName] Responses` sheet and `User Progress` columns are auto-created. Add a `saveAnswersDoc` POST with the chapter's `folderPath` if you want a Google Doc.
6. **Register in `admin.html`:**
   - Add the chapter to `COURSES.<course>` with `{ id, name, desc, available: true }` so it appears in the lock/unlock list.
   - Add a `CHAPTER_DEFS.<id>` entry (`label`, `course`, `slideFields`, `contentFields`, `assessFields`) so it appears in the content editor. Field IDs must match the `data-editable` attributes.
7. **Add a card in `hub.html`** — mirror an existing chapter block: read `unlockedChapters.beginner` and `progress.<id>.completed`, render Locked / Unlocked / Completed, and wire the auto-unlock/safety-net logic for whatever gates this chapter.

---

## Adding a new course (track)

Courses are the top-level grouping (`beginner`, `intermediate`, `advanced`) keyed inside `unlockedChapters` and `COURSES`.

1. **`admin.html` → `COURSES`** — add a new key (e.g. `expert`) with its `section` groups and chapter rows. Mark unbuilt chapters `available: false` ("Coming Soon").
2. **`admin.html` → course pills** — ensure the new course renders as a selectable pill (see `renderCoursePills` / `selectCourse`). `toggleChapter` already writes to `unlockedChapters.<course>` generically.
3. **`unlockedChapters.<course>`** — the new course's unlock array is created on first unlock; no schema migration needed.
4. **`hub.html`** — the hub currently renders the Beginner track. To surface a new course, add its chapter cards and read `unlockedChapters.<course>` instead of (or alongside) `beginner`. Set the course label shown in the header.
5. **Per-chapter `CHAPTER_ID` + course** — give each new chapter a unique ID and set `course: '<course>'` in its `CHAPTER_DEFS` entry. Chapter pages read whichever `unlockedChapters.<course>` array their chapter belongs to.

---

## Course levels

| Level | Current content |
|-------|-----------------|
| Beginner | Org Chapters (ch1, ch2) + AM Chapters (amch1, amch2; amch3/amch4 coming soon) + VO/OD sections (placeholders) |
| Intermediate | Placeholder — "Coming soon" |
| Advanced | Placeholder — "Coming soon" |

---

## localStorage keys

Used for draft recovery and as a fallback only — Firestore is authoritative.

| Key | Set when | Value |
|-----|----------|-------|
| `myhq_name`, `myhq_email` | Login (where set) | First name / email — fallback for answer docs |
| `myhq_<ch>_answers` | Draft + submit | JSON of question answers |
| `myhq_<ch>_submitted`, `myhq_<ch>_complete` | Submit | `'true'` |

Sign out (`auth.signOut()`) clears the Firebase session and redirects to `landing.html`; localStorage is left intact for draft recovery.

---

## Assets

| Folder | Description |
|--------|-------------|
| `quotes_avatar/` | Employee photos for quote sections |
| `ch1_book_images/`, `ch2_book_images/` | Chapter read-mode images |
| `logos_clientele_supply/` | Client & supply-partner logos (Who We Are clientele slide) |
| `logo_landing_hub/` | Landing & hub logo assets |
| `photos_ch2/` | Photography for Chapter 2 |
| `city_images_KYG/` | Imagery for Know Your City |
