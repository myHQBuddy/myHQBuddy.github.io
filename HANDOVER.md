# myHQBuddy — Platform Handover

**Prepared for:** Rohit Bagga
**Purpose:** Explain what myHQBuddy is, the platforms it runs on, what each platform does, and who owns each one — so the platform can be maintained and kept running after handover.

---

## Part 1 — Non-Technical Overview (for Rohit)

### What myHQBuddy is
myHQBuddy is the internal **training & onboarding web app** for myHQ employees. New joiners log in with their myHQ Google account and work through interactive, chapter-based learning content (slides + read-along), then complete assessments (quizzes and file/audio uploads) that you, as admin, can review and use to unlock the next chapter.

It is a **website made of plain files** (no server we run ourselves). It leans on a few Google/Firebase services to handle login, save data, and store uploaded files. Nothing here costs money under normal usage — it runs on free tiers.

### The platforms it's built on — and who owns each

| Platform | What it does for myHQBuddy | Owner (account to keep) |
|---|---|---|
| **GitHub** (repo: `myHQBuddy/myHQBuddy.github.io`) | Stores all the website code and **hosts the live site** (GitHub Pages). Pushing a change here = updating the live site. | **Rohit / myHQ-controlled** |
| **Firebase** (project: `myhq-td-fcf03`) | Handles **login** (Google sign-in, myHQ emails only) and the **database** (user list, who's an admin, each person's progress, and the editable chapter content used by the admin panel). | **rohit.bagga@myhq.in** |
| **Google Apps Script + Google Sheet + Google Drive** | Receives **assessment submissions**: logs responses into a Google Sheet and saves uploaded files/recordings into a Google Drive folder. | **manoj@myhq.in** (VP) |
| **CDNs** (Cloudflare, Google Fonts) | Load fonts and icons. Public, free, nothing to manage. | n/a (public services) |

### The single most important thing to protect
The platform is owned entirely within myHQ across two senior accounts:
1. **Rohit's account** — owns GitHub (the site) and Firebase (login + data).
2. **Manoj's account (VP)** — owns the Apps Script, the responses Sheet, and the Drive upload folder.

Both are permanent myHQ leadership accounts, so ownership is stable. The only handover concern is the **intern's** access: ensure nothing critical lives solely under the intern's personal account and that the intern's access is removed after handover (see the Offboarding Checklist at the end).

### Who can use it / who is "admin"
- Only **@myhq.in** Google accounts can log in (enforced at login).
- **rohit.bagga@myhq.in** is the hard-coded **Master Admin** — full access to the admin panel (edit content, manage users, unlock chapters, review submissions).
- Other people can be made "admin" from within the data (Firestore), but Rohit's email is the built-in master.

---

## Part 2 — Technical Appendix (for a future developer)

### Tech stack at a glance
- **Frontend:** Plain HTML/CSS/JavaScript. No build step, no framework. Each chapter is a single self-contained `.html` file. Firebase is loaded via the v9 **compat** SDK from a CDN.
- **Hosting:** GitHub Pages, served from the `main` branch of `myHQBuddy/myHQBuddy.github.io`. Pushing to `main` auto-deploys (~1 min). No custom domain (no CNAME) — served at `https://myhqbuddy.github.io/`.
- **Auth + DB:** Firebase (Auth + Cloud Firestore), project `myhq-td-fcf03`, region `asia-south1`.
- **Submissions backend:** A single Google Apps Script web app (doGet/doPost) bound to a Google Sheet, writing uploads to a Google Drive folder.

### Platform-by-platform detail

#### 1. GitHub — hosting & source of truth for code
- Repo: `https://github.com/myHQBuddy/myHQBuddy.github.io`
- Live site: `https://myhqbuddy.github.io/`
- Deploy model: GitHub Pages builds from `main`. Every push redeploys automatically.
- **Cache gotcha:** after a push, the live site can show stale content due to browser caching. Hard-refresh (Cmd/Ctrl+Shift+R) or open in Incognito to verify the real deployed version. The *server* is almost always correct within a minute.
- Owner: **Rohit / myHQ-controlled**.

#### 2. Firebase — `myhq-td-fcf03` (Owner: rohit.bagga@myhq.in)
Config lives in [`firebase-config.js`](firebase-config.js) (loaded by every page). Two services are used:

**Firebase Authentication**
- Provider: Google sign-in (`GoogleAuthProvider`), with `hd: 'myhq.in'` hint; login flow in [`landing.html`](landing.html).
- Any non-`@myhq.in` user is signed out immediately (logic in `firebase-config.js`).
- `MASTER_ADMIN_EMAIL = 'rohit.bagga@myhq.in'` — auto-granted `masterAdmin: true` on login.

**Cloud Firestore** — collections used by the app:
| Collection | Purpose |
|---|---|
| `users` | One doc per user (uid): name, email, lastLogin, `isAdmin`/`masterAdmin` flags, `progress.<chapterId>` (completed/submitted), `unlockedChapters`, and saved quiz selections. |
| `content` | The live CMS content per chapter (`content/<chapterId>`). Each `data-editable` key on a page can be overridden here. Injected into pages at runtime via `el.innerHTML = cData[key]`. |
| `content-drafts` | Pending admin edits awaiting master-admin review before they go live into `content`. |

> **Important CMS behavior:** chapter pages overlay `content/<chapterId>` values on top of the HTML. If a stored value is stale, it overrides the file on the **live site** (localhost skips this — see `DEV_PREVIEW`). Some fields are intentionally pinned to the file via a `FILE_SOURCE_OF_TRUTH` map in the page so the CMS can't override them (currently used in `policies_benefits.html` for ch3 bodies and `what_we_do/What_We_Do_AM.html` for the consultant count). See [`MEMORY` note: ch3-body-file-source-of-truth] / commit history for context.
- Firestore security rules: `firestore.rules` (in repo). Confirm the deployed rules in the Firebase Console match intent (the local file has been minimal at times).
- **Note:** `.firebaserc` currently points `default` at an unrelated project (`bingo-live-app-ca416`). The **real** project is `myhq-td-fcf03` (from `firebase-config.js`). Use `--project myhq-td-fcf03` with the Firebase CLI, or fix `.firebaserc`.

#### 3. Google Apps Script + Sheet + Drive (Owner: manoj@myhq.in)
- Web app endpoint (referenced in pages as `SHEET_URL` / `UPLOAD_SCRIPT_URL`):
  `https://script.google.com/macros/s/AKfycbwX0Z5vx6DSwdwZwK26pKZL3V3U9XwEyWgPa9Ek_cFEH1_tpULnWNcn7RlgE-wT8M9M/exec`
- Source is checked into the repo as [`Code.gs`](Code.gs) (mirror of the script). It handles `doGet`/`doPost` actions:
  - `login` / `loginWithProgress` / `getProgress` — read user + chapter responses from the bound Google Sheet (sheets: `username`, `<Chapter> Responses`).
  - `admin` — admin read of all users (guarded by a key `myHQBuddyadmin`).
  - `uploadFile` — decodes a base64 file and saves it into Drive.
- **Drive root folder ID:** `1rtaqTqSJlRJ7HmOrlObgjKxmmomHO_8b`. Uploads are filed into per-chapter subfolders (e.g. `01 - Know Your City/City Presentations`), with filenames like `FirstName_Suffix.ext`.
- The bound **Google Sheet** stores user records and chapter responses.
- Owner: **manoj@myhq.in** — the script, the Sheet, and the Drive folder all live in Manoj's Google account.

> ⚠️ Two backends exist by design: **Firebase** is the primary auth/progress/CMS store used by the current pages; the **Apps Script + Sheet** is the older/secondary path still used for submission logging and file uploads. Both are live. A future cleanup could consolidate, but don't remove either without tracing every page's `SHEET_URL`/`UPLOAD_SCRIPT_URL` usage first.

#### 4. CDNs (no ownership / no action)
- `cdnjs.cloudflare.com` — Font Awesome icons.
- `fonts.googleapis.com`, `fonts.gstatic.com` — Google Fonts (Manrope).
- `www.gstatic.com` — Firebase SDK.

### How a typical flow works
1. User opens a chapter page → redirected to `landing.html` if not logged in.
2. Google sign-in (myHQ only) → Firebase creates/updates their `users` doc.
3. Page checks `unlockedChapters`; if locked, shows a lock screen.
4. Page injects CMS content from `content/<chapterId>` over the HTML.
5. User completes the assessment → MCQ results saved to Firestore; file/audio uploads POSTed to the Apps Script → saved to Drive + logged to the Sheet.
6. Admin (`admin.html`) reviews users/submissions, edits content (drafts → review → live), and unlocks the next chapter.

### Key files
| File | What it is |
|---|---|
| `firebase-config.js` | Firebase project config + auth gate + master-admin logic. |
| `admin.html` | Admin panel: user management, chapter unlocking, content/assessment CMS editor. |
| `chapter-shell.html` | Reusable template for building new chapters (read its HARD RULES before editing). |
| `landing.html` / `hub.html` / `index.html` | Login, chapter hub, entry point. |
| `Code.gs` | Mirror of the Google Apps Script backend (submissions/uploads). |
| `*.html` (per chapter) | Each training chapter (e.g. `policies_benefits.html`, `First_Impression.html`, `what_we_do/*`). |
| `README.md`, `SUBMISSION_FLOW.md`, `poc-guide.md` | Existing supporting docs. |

---

## Part 3 — Offboarding Checklist (do before the intern leaves)

Confirm myHQ retains control of **every** platform. Tick each:

- [ ] **GitHub** — Rohit (or a myHQ admin) has **Owner/Admin** on the `myHQBuddy` org and `myHQBuddy.github.io` repo. Remove the intern's personal account if it was an owner.
- [ ] **Firebase** (`myhq-td-fcf03`) — Confirm **rohit.bagga@myhq.in** is **Owner** in Project Settings → Users and permissions. Add a second myHQ admin as Owner for redundancy. Verify billing (if any) is on a myHQ account.
- [ ] **Google Apps Script + Sheet + Drive** — Owned by **manoj@myhq.in** (VP) — a stable, permanent myHQ account, so no transfer needed. Just confirm **Rohit** also has editor access to the script, the bound Sheet, and the Drive folder (`1rtaqTqSJlRJ7HmOrlObgjKxmmomHO_8b`) so day-to-day maintenance isn't blocked on the VP.
- [ ] **Apps Script "admin" key** — the script uses a shared secret `myHQBuddyadmin`. Rotate it if the intern knew it, and update any caller.
- [ ] **`.firebaserc`** — fix it to point `default` at `myhq-td-fcf03` (currently points at an unrelated project).
- [ ] **Access audit** — remove the intern's access from GitHub, Firebase, and the Drive folder/Sheet once handover is verified.
- [ ] **Backups** — export the Firestore data (users/content) and note the Drive folder location, so there's a recovery point.

---

*Last updated: 2026-06-26.*
