# Submission Flow — myHQ Buddy

## Overview

Every chapter a user completes sends data to a Google Apps Script backend, which writes to a Google Sheet. There are two types of writes: **user progress** (always updated on login) and **chapter responses** (written on submission).

---

## Google Sheet Structure

### `username` sheet
Managed manually. One row per user.

| Column | Value |
|--------|-------|
| A | Email (used as login ID) |
| B | Password |
| C | Name |
| D | Course (`Beginner Course`, `Intermediate`, `Advanced`) |

### `Chapter 1 Responses` / `Chapter 2 Responses`
One row per submission. Created automatically if it doesn't exist.

| Column | Value |
|--------|-------|
| Timestamp | IST datetime of submission |
| Name | User's name |
| Email | User's email |
| Q1–Q5 | Answer text for each question |

### `User Progress`
One row per user. Chapter columns are added dynamically — a new pair of columns is created the first time a chapter is submitted.

| Column | Value |
|--------|-------|
| Email | User's email |
| Name | User's name |
| Course | Course level |
| Last Login | IST datetime of last login |
| Where We Play Status | `Completed` (or custom status) |
| Where We Play Submitted At | IST datetime |
| Who We Are Status | `Completed` (or custom status) |
| Who We Are Submitted At | IST datetime |
| *(future chapter)* Status | Added automatically |
| *(future chapter)* Submitted At | Added automatically |

---

## Login Flow

1. User enters email + password on `landing.html`
2. Frontend calls `?action=loginWithProgress` (single API call)
3. Apps Script:
   - Validates credentials against `username` sheet
   - Calls `upsertUserProgress()` — creates a new row if first login, updates `Last Login` if returning
   - Reads any existing responses from `Chapter 1 Responses` and `Chapter 2 Responses`
4. Returns: `{ success, name, email, course, progress: { ch1, ch2 } }`
5. Frontend stores `name`, `email`, `course` in `localStorage` and redirects to `hub.html`

---

## Chapter Submission Flow

1. User reads the chapter, answers all questions, clicks **Submit**
2. Frontend validates minimum word count per answer
3. Frontend sends a `POST` to the Apps Script with:

```json
{
  "chapter": "Chapter 2",
  "chapterName": "Who We Are",
  "status": "Completed",
  "name": "User Name",
  "email": "user@example.com",
  "timestamp": "2026-06-08T10:00:00.000Z",
  "q1": "Answer to question 1",
  "q2": "Answer to question 2",
  "q3": "Answer to question 3",
  "q4": "Answer to question 4"
}
```

4. Apps Script (`doPost`):
   - Appends the answers to the chapter responses sheet
   - Finds the user's row in `User Progress`
   - Calls `findOrCreateChapterColumns()` with `chapterName`
   - Writes `status` (`Completed`) and the IST timestamp to those columns

---

## Dynamic Chapter Columns (`findOrCreateChapterColumns`)

This function makes the progress sheet future-proof:

- Searches row 1 of `User Progress` for `"[chapterName] Status"`
- If found → uses that column (updates existing users correctly)
- If not found but a legacy `Ch1 Status` / `Ch2 Status` header exists → renames it and uses it
- If not found at all → appends two new columns: `[chapterName] Status` and `[chapterName] Submitted At`

This means **adding a new chapter requires zero changes to the Apps Script**. Just send the correct `chapterName` from the frontend.

---

## Adding a Future Chapter

To add a new chapter (e.g. "How We Win") with a different completion type (e.g. video watched):

1. Create the chapter HTML file
2. Find the `fetch` POST call in the HTML file — it's the place where the user's answers are sent on submit. It looks like this:

```javascript
fetch(SHEET_URL, {
  method: 'POST',
  mode: 'no-cors',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({
    chapter: 'Chapter 3',
    chapterName: 'How We Win',   // human-readable name → becomes the column header in the sheet
    status: 'Video Watched',      // what "done" means for this chapter
    name: name,
    email: email,
    timestamp: new Date().toISOString()
  })
})
```

Set `chapterName` to the chapter's title and `status` to whatever completion type applies:
- Text answers → `"Completed"`
- Video watched → `"Video Watched"`
- Recording uploaded → `"Recording Uploaded"`
- Any other custom value works too

3. The Apps Script will automatically create `How We Win Status` and `How We Win Submitted At` columns in `User Progress`
4. No changes needed to `Code.gs`

---

## Course Access Control

Controlled via column D of the `username` sheet:

| Value | Access |
|-------|--------|
| Empty or `Beginner Course` | Chapter 1 only |
| `Intermediate` | Chapters 1 + 2 |
| `Advanced` | Chapters 1 + 2 + 3 |

The value is case-insensitive and normalised on the frontend (`"Intermediate Course"` → `"intermediate"`).

---

## Sign Out

Clears `localStorage` keys: `myhq_name`, `myhq_email`, `myhq_course`, `myhq_registered_at`. No server call needed.
