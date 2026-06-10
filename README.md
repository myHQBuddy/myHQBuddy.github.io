# myHQ Buddy

An internal learning platform built for myHQ — a structured, chapter-based onboarding experience that helps new employees understand the business, the market, and the culture through interactive content, reflection questions, and tracked progress.

---

## What it does

- Employees log in with their myHQ email and password
- Based on their course level, specific chapters are unlocked
- Each chapter has a **slide deck** for presentations and a **full read mode** for self-paced learning
- At the end of each chapter, employees answer reflection questions which are submitted and tracked
- Progress is stored per user and persists across devices and sessions
- Admins can view completion status and responses in a live Google Sheet dashboard

---

## Pages

| File | Description |
|------|-------------|
| `landing.html` | Login page — authenticates against Google Sheet |
| `hub.html` | Course hub — shows available and locked chapters based on course level |
| `Where_We_Play_v2.html` | Chapter 1: Where We Play — market, competition, and positioning |
| `Who_We_Are_v2.html` | Chapter 2: Who We Are — company story, team, culture, and ambition |
| `admin.html` | Admin dashboard — view all users, completion status, and submitted answers |

---

## Assets

| Folder | Description |
|--------|-------------|
| `quotes_avatar/` | Employee photos for the Human Engine quotes section |
| `ch2_book_images/` | Images used in Chapter 2 |
| `ch1_book_images/` | Images used in Chapter 1 |
| `logos_clientele_supply/` | Client and supply partner logos |
| `logo_landing_hub/` | Logo assets for landing and hub pages |
| `photos_ch2/` | Photography used in Chapter 2 |

---

## Backend

Powered by a **Google Apps Script** web app connected to a Google Sheet with the following sheets:

| Sheet | Purpose |
|-------|---------|
| `username` | User credentials and course level |
| `User Progress` | Login history and chapter completion status per user |
| `Where We Play Responses` | Submitted answers for Chapter 1 |
| `Who We Are Responses` | Submitted answers for Chapter 2 |
| *(future chapter)* Responses | Created automatically when a new chapter is submitted |

---

## Course Levels

| Level | Access |
|-------|--------|
| Beginner | Chapter 1 only |
| Intermediate | Chapters 1 + 2 |
| Advanced | All chapters |

Set per user in column D of the `username` sheet. Case-insensitive.

---

## Adding a New Chapter

1. Build the chapter HTML file
2. In the submit `fetch` call, include `chapterName` and `status`:
```javascript
body: JSON.stringify({
  chapterName: 'How We Win',
  status: 'Completed',
  name, email, q1, q2, q3 ...
})
```
3. A new `How We Win Responses` sheet and progress columns are created automatically
4. No changes needed to `Code.gs`

See `SUBMISSION_FLOW.md` for the full technical breakdown.
