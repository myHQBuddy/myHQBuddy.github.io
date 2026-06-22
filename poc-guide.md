# Chapter Author Guide — myHQ Buddy

You've been asked to build a chapter for myHQ's onboarding course. You get two files:

| File | What it is |
|------|------------|
| `chapter-shell.html` | The structural scaffold. Already has the slide engine, login gate, and submission wiring. **You only add content.** |
| `poc-guide.md` | This file. The top half is for you. The bottom half is reference for the LLM. |

> **You don't need to know how to code.** You give the content; the LLM fills the shell. Your job is to provide good material and check the result.

---

## Before you start — get these from the admin

| What you need | Example |
|---|---|
| Your **course type** | AM / VO / Org / Beginner |
| Your **chapter number** within that course | "You're writing the 2nd VO chapter" |
| The **next chapter's id** to unlock after yours | `voch2`, or "none" |
| The **human title** of your chapter | "Know Your Client" |

That's all. Everything else (the chapter id, Drive folder path, top bar label) you'll work out with the LLM in Step 2.

---

## The process — start to finish

### Step 1 — Open Claude or ChatGPT
Attach both files:
- `chapter-shell.html`
- `poc-guide.md` (this file)

Then paste the prompt from the **LLM Prompt** section at the bottom of this guide.

---

### Step 2 — Answer the LLM's questions, one group at a time

The LLM will ask five groups of questions and wait for your answers before moving on.

**Group 1 — Identity**
The LLM will propose your chapter id and Drive folder path based on your course type and title, and confirm with you. You just provide the title, course type, next chapter id, and top bar label.

**Group 2 — Core content**
What is the chapter about? What are the 3–5 main ideas? For each idea, paste your raw notes — data, examples, explanations. Don't format it; just write.

**Group 3 — Facts and proof points**
Any numbers or stats? Any timeline or sequence? Real examples or stories? Comparisons you want to make?

**Group 4 — Tone and emphasis**
The single most important takeaway. Any misconceptions to address. The tone that fits (data-driven, storytelling, instructional, etc.).

**Group 5 — Structure**
How many slides, which layout for each (the LLM will suggest if unsure). Read mode yes/no. Assessment type and questions. Any images.

---

### Step 3 — Receive and save the filled HTML

The LLM outputs a complete, ready-to-use HTML file with all your content filled in and all placeholders replaced.

Save it as `<chapterid>.html` (e.g. `voch2.html`).

---

### Step 4 — Add your images (if any)

Create a folder called `chapter_images/` next to the HTML file. Drop your images in, named per the convention the LLM will tell you (e.g. `voch2-cover.jpg`, `voch2-sl2-diagram.png`).

---

### Step 5 — Check your work locally

Open the HTML via a local server — **not** by double-clicking the file (that breaks login). The login gate is automatically skipped on localhost so you can preview immediately.

**How to run the local server:**
1. Open Terminal
2. `cd /path/to/your/chapter/folder`
3. `python3 -m http.server 8080`
4. Open `http://localhost:8080/yourchapter.html` in Chrome

Stop the server with `Ctrl+C` when done.

**Check these things:**
- [ ] No `{{...}}` placeholders left (search the file for `{{`)
- [ ] Arrow keys move between slides; the "1 / N" counter is correct
- [ ] Browser zoom in/out (Cmd/Ctrl +/−) makes the slide bigger, not smaller
- [ ] Read mode opens; sidebar links jump to the right sections
- [ ] Assessment submit button only enables when all questions are answered

---

### Step 6 — Hand off to the admin

Send the admin:
- The **HTML file**
- The **`chapter_images/` folder** (if you have images)

The admin handles registering the chapter in the hub, wiring the unlock chain, and deploying. The Drive folder and Sheet tab are created automatically on the first real submission — you don't need to set anything up.

---

## What's out of scope for you

- **Registering the chapter** in the hub / course menu — the admin does this
- **Firebase, login, unlock chain, the response Sheet / Drive** — already built, don't touch
- **The visual design** — colors, fonts, component styles are locked so all chapters match

If you think you need any of the above changed, talk to the admin rather than editing the locked code.

---
---

# Reference — for the LLM building the chapter

> **POC:** You don't need to read this section. It's here so the LLM has complete context to build your chapter correctly when you attach this file.

---

## Chapter ID naming convention

| Course type | Pattern | Examples |
|---|---|---|
| Beginner chapters | `ch` + number | `ch1`, `ch2` |
| AM (Account Manager) chapters | `amch` + number | `amch1`, `amch2`, `amch3` |
| VO (Virtual Office) chapters | `voch` + number | `voch1`, `voch2` |
| Org chapters | `orgch` + number | `orgch1`, `orgch2`, `orgch3` |
| Other / future courses | `<shortprefix>ch` + number | `salch1`, `opsch2` |

The number is sequential within that course type. If unsure, ask the POC how many chapters already exist in that course.

---

## Drive folder path convention

`DRIVE_FOLDER` is a subfolder path string — not a URL or Drive link. The folder is created automatically on first submission. Derive it from course type and chapter title:

| Chapter type | Path format | Example |
|---|---|---|
| AM chapter | `AM Chapters/<Chapter Title>` | `AM Chapters/Know Your Market` |
| VO chapter | `VO Chapters/<Chapter Title>` | `VO Chapters/Virtual Office Essentials` |
| Org chapter | `Org Chapters/<Chapter Title>` | `Org Chapters/Company Culture` |
| Beginner chapter | `Beginner Chapters/<Chapter Title>` | `Beginner Chapters/Where We Play` |
| Other / custom | `<Type> Chapters/<Chapter Title>` | `Sales Chapters/Closing Techniques` |

---

## The 4 CONFIG variables (only things the LLM sets in `<script>`)

```js
var CHAPTER_ID   = 'voch2';                        // derived from naming convention above
var NEXT_CHAPTER = 'voch3';                         // id to unlock on completion; '' if none
var CHAPTER_NAME = 'Virtual Office Essentials';     // human title — used for Sheet tab + Google Doc name
var DRIVE_FOLDER = 'VO Chapters/Virtual Office Essentials'; // path string, not a URL
```

Replace **every `{{ID}}`** in the file with the chapter id. It appears in `data-editable` keys, image paths, and the CONFIG block.

---

## Golden rules — never break these

1. **Never modify `scaleSlides()` or any CSS / JS marked "DO NOT EDIT".** This function handles responsiveness and browser zoom for the fixed 1440×900 canvas. Any change breaks the layout on other screens.
2. **Inside a slide, only use fixed `px` values.** Never use `vw`, `vh`, `%` font sizes, or `clamp()` inside a `.screen` div. The canvas is scaled as a whole — those units resolve against the browser viewport, not the canvas.
3. **Never set `document.body.style.overflow = 'hidden'` anywhere.** The body must stay `overflow: auto` at all times — it is what enables zoom-and-scroll. The `setMode()` function already handles this correctly; do not change it.
4. **Keep every `data-editable="..."` attribute.** The admin content editor uses these keys to allow text edits without touching code. You may change the text inside; never remove the attribute. Every key must be unique — prefix with the chapter id + slide number (e.g. `voch2-sl1-headline`).
5. **Only change the 4 CONFIG variables and content slots.** Do not touch the Firebase auth gate, the submission logic, or the Firestore writes.

---

## Slide archetypes

The shell ships with Cover + 5 plain content slides + assessment intro. Replace content slides by copying archetype blocks from the catalog at the bottom of `chapter-shell.html` into `#slides`.

| Archetype | Use it for | Key slots |
|---|---|---|
| **A) Cover** | Opening slide (already placed) | eyebrow, headline, sub, optional image |
| **B) Big Stat** | One hero number + up to 4 supporting facts | big number, caption, 4 fact pairs |
| **C) Timeline** | A sequence over time (up to 5 nodes) | per node: year, title, one-line detail |
| **D) Two Column** | Comparing two things side by side | left/right title + body |
| **E) Card Grid** | 3+ parallel points with icons | per card: icon (Font Awesome class), title, body |
| **F) Quote / Callout** | A single powerful line or quote | quote text, attribution |

**Rules for slide content:**
- Headlines ≤ ~10 words; body ≤ ~2 short sentences. Slides are glanceable.
- Use `<span>…</span>` (or `<em>…</em>` on cover) to color a key phrase blue.
- Long prose belongs in read mode, not slides.
- Slide count is auto-counted from `.screen` divs — add or remove slides freely.
- Never uncomment catalog blocks in place. Copy them into `#slides` as new `.screen` divs.

---

## Read mode CSS (copy exactly — do not infer)

The read mode layout must use these exact CSS values. Do not use `display: grid`, `max-width: 1200px`, or `margin: 0 auto` — those produce a narrow centered layout instead of full-width:

```css
.r-layout { display: flex; max-width: 100%; margin: 0; padding: 0 48px 80px 0; align-items: flex-start; }
.r-sidebar { width: 240px; flex-shrink: 0; position: sticky; top: 52px; padding: 32px 24px 0 24px; max-height: calc(100vh - 52px); overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.r-content { flex: 1; min-width: 0; padding: 40px 0 0 48px; }
```

These are already correct in `chapter-shell.html` — copy them as-is, do not modify.

---

## Read mode structure

Read mode has: intro section + N content sections + assessment section. Each section needs:
- A unique `id` on the `<section>` tag (e.g. `r-s01`)
- A matching TOC link: `<a href="#r-s01" class="toc-link" data-s="r-s01">01 · Section Title</a>`
- `data-editable` keys prefixed with chapter id (e.g. `voch2-s01-title`)

Per section slots: `section-num`, `section-title`, `section-outcome` (learning outcome), `section-body` (full prose), `takeaway` (optional one-liner).

If the POC doesn't want read mode: delete the entire `#read-mode` block and the "Read Full Chapter" button in the topbar.

---

## Assessment variants

**Open-text (default — already built):**
- 3 textarea questions. `TOTAL_QUESTIONS = 3`. Each answer requires ≥ 5 words to count as filled.
- To change question count: edit questions in `#r-assess` form AND update `TOTAL_QUESTIONS`.
- Good questions: open-ended, no single right answer, reward genuine observation.

**MCQ:**
- Replace each `<textarea>` with a group of radio inputs:
  ```html
  <div class="aq-options">
    <label class="aq-option"><input type="radio" name="q1" value="A" onchange="onAnsInput(1)"> Option A</label>
    <label class="aq-option"><input type="radio" name="q1" value="B" onchange="onAnsInput(1)"> Option B</label>
    <label class="aq-option"><input type="radio" name="q1" value="C" onchange="onAnsInput(1)"> Option C</label>
  </div>
  ```
- Update `onAnsInput()` to count a question answered when a radio for that `name` is `:checked` instead of checking word count.
- The selected option value is submitted as the answer string — the submission logic is otherwise identical.

**File upload (AM-chapter style):**
- Replace textarea with: `<input type="file" id="aq1-file" accept=".pdf,.pptx,.png,.jpg" onchange="onFilePick(1)">`
- Uses the Apps Script `action:'uploadFile'` route: base64-encoded file body, `folderPath` + `fileSuffix` fields.
- More involved — flag to the POC that the admin needs to wire this (add the chapter to `UPLOAD_CHAPTERS` in `Code.gs`).

**No assessment:**
- Delete the entire `#r-assess` section, its TOC link, and the assessment-intro `.screen` in slide mode.
- If the chapter should still be markable complete, add a "Mark as complete" button that calls the Firestore progress write directly — flag this to the admin.

---

## Image naming convention

All images go in `chapter_images/` next to the HTML file. Name files descriptively:

```
<chapterid>-<where>-<what>.ext
```

| Example filename | Where it goes |
|---|---|
| `voch2-cover.jpg` | Cover slide image |
| `voch2-sl2-diagram.png` | Slide 2 image |
| `voch2-read-s01-map.jpg` | Read mode section 01 image |

All image tags in the shell include `onerror="this.style.display='none'"` — a missing image won't break the layout. After filling the shell, list which image filenames the POC needs to provide.

---

## Admin registration — CHAPTER_DEFS and COURSES

After building the chapter HTML, the LLM must also output two blocks for the admin to paste into `admin.html`.

### 1. CHAPTER_DEFS entry

Add inside the `CHAPTER_DEFS = { ... }` object in `admin.html`. One entry per chapter. The `id` in each field must exactly match the `data-editable` attribute in the HTML. The `default` value must be the actual content placed in the HTML (not a placeholder):

```js
// Example structure — fill with real values from the chapter
CHAPTER_ID: {
  label: 'CHAPTER_NAME',
  course: 'beginner',
  slideFields: [
    { id: 'CHAPTER_ID-cover-eyebrow', label: 'Cover Eyebrow',  type: 'input',    group: 'Cover', default: '...' },
    { id: 'CHAPTER_ID-cover-headline',label: 'Cover Headline', type: 'input',    group: 'Cover', default: '...' },
    { id: 'CHAPTER_ID-cover-sub',     label: 'Cover Sub',      type: 'input',    group: 'Cover', default: '...' },
    // one entry per data-editable inside #slides
  ],
  contentFields: [
    { id: 'CHAPTER_ID-s01-title',    label: 'Title',           type: 'input',    group: 'S01 — Section Title', default: '...' },
    { id: 'CHAPTER_ID-s01-outcome',  label: 'Learning Outcome',type: 'textarea', group: 'S01 — Section Title', default: '...' },
    { id: 'CHAPTER_ID-s01-body',     label: 'Body',            type: 'textarea', group: 'S01 — Section Title', default: '...' },
    { id: 'CHAPTER_ID-s01-takeaway', label: 'Takeaway',        type: 'input',    group: 'S01 — Section Title', default: '...' },
    // repeat for each read-mode section
  ],
  assessFields: [
    { id: 'CHAPTER_ID-assess-q1', label: 'Question 1', type: 'textarea', default: '...' },
    { id: 'CHAPTER_ID-assess-q2', label: 'Question 2', type: 'textarea', default: '...' },
    { id: 'CHAPTER_ID-assess-q3', label: 'Question 3', type: 'textarea', default: '...' },
  ]
},
```

Rules:
- `slideFields` = every `data-editable` inside `#slides` (the slide canvas). Use `type:'input'` for short text, `type:'textarea'` for longer body copy.
- `contentFields` = every `data-editable` inside `#read-mode` except assessment questions.
- `assessFields` = every `data-editable` on assessment question text elements (`orgch3-assess-q1` etc.).
- `group` = a human-readable label for the admin UI section — use `"Slide N — Slide Title"` for slides and `"S0N — Section Title"` for read mode sections.
- `default` = copy the exact text content placed in the HTML, not a placeholder.

### 2. COURSES entry

Find the correct section in `COURSES` in `admin.html` and either update the placeholder entry or add a new one:

```js
{ id: 'CHAPTER_ID', name: 'CHAPTER_NAME', desc: 'One-line description', available: true }
```

Set `available: true` once the chapter is live. Until then keep `false`.

---

## Submission flow (for reference — do not modify)

On assessment submit, the shell does three things in sequence:

1. **Firestore write** — sets `progress.<CHAPTER_ID>.completed = true` and `arrayUnion(NEXT_CHAPTER)` into `unlockedChapters.beginner` on the user's doc.
2. **Sheet POST** — appends a row to `[CHAPTER_NAME] Responses` tab (created automatically if it doesn't exist). Fields: timestamp, name, email, q1–q10.
3. **Google Doc POST** — creates `<FirstName>_<CHAPTER_NAME>_Answers` in the Drive folder at `DRIVE_FOLDER` (relative to the shared root). Old doc with same name is trashed on re-submit.

Both POSTs go to the shared Apps Script endpoint via `mode:'no-cors'` (fire-and-forget). Do not change the endpoint URL or the POST structure.

---

## Dev preview note

The auth gate and lock screen are automatically bypassed when the chapter is opened on `localhost` or `127.0.0.1`. This is intentional — it lets POCs preview locally without needing a Firebase account or chapter unlock. On the live site (GitHub Pages) the full auth check runs normally.

---

## LLM Prompt

```
You are helping me fill in a chapter template for myHQ's onboarding course.
I'm attaching two files: chapter-shell.html and poc-guide.md.
Read poc-guide.md fully — the bottom "Reference" section has everything
you need to build the chapter correctly.

Ask me these questions ONE GROUP AT A TIME and wait for my full answers
before moving to the next group:

GROUP 1 — Identity
1a. What type of chapter is this? (AM / VO / Org / Beginner / other)
1b. What is the human title of this chapter?
1c. How many chapters of this type already exist? (so I can assign the right number)
1d. What is the next chapter's id to unlock after this one? (or "none")
1e. What label appears in the top bar? (e.g. "AM Chapter 3" or "VO Chapter 1")

After I answer, propose: the chapter id, the Drive folder path, and confirm
both with me before continuing.

GROUP 2 — Core content
2a. What is the one-sentence purpose of this chapter? What should a learner
    be able to do or know by the end?
2b. What are the 3–5 main ideas or sections you want to cover? List them in order.
2c. For each main idea, paste your raw content — data points, stories,
    examples, explanations. Don't worry about formatting; just get it all down.

GROUP 3 — Facts and proof points
3a. Any specific numbers, statistics, or data points? List them.
3b. Any timelines, milestones, or sequences of events?
3c. Any real examples, case studies, or stories to include?
3d. Any comparisons or "left vs right" contrasts to make?

GROUP 4 — Tone and emphasis
4a. The ONE most important takeaway — if a learner remembers nothing else,
    what must they remember?
4b. Any common misconceptions or mistakes to address?
4c. What tone fits? (e.g. energetic + data-driven / calm + instructional / storytelling)

GROUP 5 — Structure
5a. How many slides? (default: Cover + 5 content + assessment intro = 7 total)
    For each content slide, which archetype? (Cover / Big Stat / Timeline /
    Two Column / Card Grid / Quote) — suggest from my material if unsure.
5b. Read mode — yes or no? (recommended yes)
5c. Assessment type: open-text, MCQ, file upload, or none?
    If open-text or MCQ: how many questions, and what should they ask?
5d. Do you have images? If yes, list what you have and I'll assign filenames.

THEN build the chapter following these rules exactly:
- NEVER modify scaleSlides() or any CSS/JS marked "DO NOT EDIT".
  Do not change the auth gate or submission logic.
- NEVER set document.body.style.overflow = 'hidden'. Body must stay overflow:auto
  for zoom-and-scroll to work. setMode() already handles this correctly.
- For read mode layout, copy the r-layout / r-sidebar / r-content CSS exactly from
  the shell. Never use display:grid, max-width:1200px, or margin:0 auto on r-layout
  — those produce a narrow centered layout. The correct values are in the reference
  section of poc-guide.md.
- Set only the 4 CONFIG variables (CHAPTER_ID, NEXT_CHAPTER, CHAPTER_NAME,
  DRIVE_FOLDER) and replace every {{ID}} with the chapter id throughout.
  DRIVE_FOLDER is a path string, not a URL — derive it from the reference section.
- Copy archetype blocks from the catalog at the bottom of the shell into #slides.
  Every data-editable key must be unique: prefix with chapter id + slide number.
  Inside slides, fixed px only — never vw, vh, %, or clamp().
- Keep slide text short and glanceable. Put long prose in read mode.
- Fill read mode sections with matching TOC links and data-editable keys.
- Set the assessment to the chosen type; set TOTAL_QUESTIONS to match.
- Remove all {{...}} placeholders and unused catalog blocks, archetype CSS,
  read mode sections, and assessment variants the POC is not using.

OUTPUT in this order:
1. The complete filled chapter HTML, ready to save.
2. The CHAPTER_DEFS entry for admin.html — a JS object block the admin pastes
   inside CHAPTER_DEFS = { ... }. Every data-editable id in the HTML must appear
   as a field. slideFields = data-editables inside #slides. contentFields =
   data-editables inside #read-mode except assessment questions. assessFields =
   assessment question data-editables. Use the actual content as the default value,
   not a placeholder. Use type:'input' for short text, type:'textarea' for body copy.
   group = human label for the admin UI: "Slide N — Title" for slides,
   "S0N — Section Title" for read-mode sections.
3. The COURSES entry — a one-line JS object the admin pastes into the correct
   section array in COURSES in admin.html:
   { id: 'CHAPTER_ID', name: 'CHAPTER_NAME', desc: 'one-line description', available: true }
4. Image filenames the POC needs to add to chapter_images/ (if any).
5. Anything else the admin needs to do (e.g. wire file upload route in Code.gs).
```
