# Chapter Author Guide — myHQ Buddy

You've been asked to build a chapter for myHQ's onboarding course. You get two files:

| File | What it is |
|------|------------|
| `chapter-shell.html` | The structural scaffold you fill in. It already has the slide engine, responsiveness, login gate, and submission wiring built. **You only add content.** |
| `poc-guide.md` | This file. Read it fully before you start. |

You'll fill the shell **with the help of an LLM** (Claude / ChatGPT). This guide tells you what every slot means, the rules you must follow, the slide layouts you can use, and gives you a ready-to-paste prompt for the LLM.

> **You don't need to know how to code.** You provide the content + raw material; the LLM fills the placeholders. Your job is to give good content and check the result.

---

## How the chapter works (1-minute mental model)

A chapter has **two modes**, both already built into the shell:

- **Slide mode** — a presentation deck (like PowerPoint), one slide at a time, arrow keys to move. This is the default view.
- **Read mode** — a scrollable long-form version of the same content, with a sidebar table of contents. Opened via the "Read Full Chapter" button. **Recommended but optional.**

At the end, learners answer an **assessment**. On submit, their answers are saved (to a Google Doc + a sheet), the chapter is marked complete, and the next chapter unlocks automatically.

The look (colors, fonts, spacing) and the technical plumbing are **already done and locked**. You are only writing words and choosing layouts.

---

## The golden rules (do not break these)

1. **Never touch `scaleSlides()` or the CSS marked "DO NOT EDIT."** That code makes the slide fit every screen size and zoom level. If you change it, the chapter breaks on other people's monitors.
2. **Inside a slide, only use fixed pixel sizes** (e.g. `font-size: 44px`). Never use `vw`, `vh`, `%` font sizes, or `clamp()` inside a slide. The slide is one big canvas that gets scaled as a whole — those units measure the wrong thing and cause the bug in rule 1.
3. **Keep every `data-editable="..."` attribute.** Those let the admin edit your chapter's text later without touching code. You can change the *text inside* the tag; never delete the attribute. Make each `data-editable` key **unique** — use your chapter id (see below) as the prefix.
4. **Don't touch the login gate or the submission code.** The only script settings you change are the four CONFIG variables (below). Everything else in `<script>` is shared and locked.

---

## Step 1 — Set your chapter's identity (4 values)

Near the top of the `<script>` block in the shell there are four CONFIG variables. Get these from the admin:

```js
var CHAPTER_ID   = '{{ID}}';                 // e.g. 'amch3' — unique id, must match admin + hub
var NEXT_CHAPTER = '{{NEXT_ID}}';            // id of the chapter to unlock after this one ('' if none)
var CHAPTER_NAME = '{{CHAPTER_TITLE}}';      // human title, used for the saved answers (e.g. 'Know Your Market')
var DRIVE_FOLDER = '{{DRIVE_FOLDER_PATH}}';  // Drive folder for answers (e.g. 'AM Chapters/Know Your Market')
```

Then replace **every `{{ID}}`** in the file with your chapter id. The LLM prompt does this for you. (`{{ID}}` appears in `data-editable` keys, image paths, and config — replacing it everywhere keeps your chapter's data separate from other chapters'.)

> Chapter linking into the course menu/hub is handled **by the admin, not you** — out of scope here.

---

## Step 2 — Understand the placeholder syntax

Two kinds of placeholders in the shell:

| Looks like | Means |
|------------|-------|
| `{{SLIDE1_HEADLINE}}` | A **text slot** — replace with your words. |
| `<!-- POC SLOT: ... -->` | A **note to you** explaining what goes nearby. Delete the comment once done (optional). |

Anything wrapped in `<!-- ... -->` is a comment (invisible on the page). The big **archetype catalog** at the bottom of the shell is commented out on purpose so it doesn't render — you copy blocks out of it.

---

## Step 3 — Build your slides from the archetype catalog

The shell ships with a **default scaffold**: a Cover slide + 5 content slides + an assessment. Each content slide is a plain headline/body to start. To make a slide richer, **copy an archetype** from the catalog at the bottom of the shell and paste it in place of a content slide.

### Available slide archetypes

| Archetype | Use it for | Key slots |
|-----------|-----------|-----------|
| **A) Cover** | The opening slide (already placed as Screen 0) | eyebrow, headline, sub, optional image |
| **B) Big Stat** | One hero number + up to 4 supporting facts | the big number, caption, 4 fact pairs |
| **C) Timeline** | A sequence over time (up to 5 nodes) | per node: year, title, one-line detail |
| **D) Two Column** | Comparing two things side by side | left/right title + body |
| **E) Card Grid** | 3 (or more) parallel points with icons | per card: icon, title, body |
| **F) Quote / Callout** | A single powerful line or quote | quote text, attribution |

**To use one:** copy the block from the catalog → paste it as a new `<div class="screen"> … </div>` inside `#slides` (replacing a default content slide) → fill the slots → make each `data-editable` key unique by replacing `ID` with your chapter id and `slN` with the slide number.

**Slide count is automatic** — the engine counts your `.screen` divs, so the dots and "1 / N" counter update themselves. Add or delete slides freely. (Don't uncomment catalog blocks in place; only paste copies up into `#slides`.)

### Rules for slide content
- Keep slide text **short** — slides are glanceable, not paragraphs. Headlines ≤ ~10 words; body ≤ ~2 short sentences.
- Use `<span>…</span>` (or `<em>…</em>` on the cover) to color a key phrase blue.
- Don't overfill a slide. If you have a lot to say, that belongs in **read mode**.

---

## Step 4 — Fill read mode (recommended)

Read mode mirrors your chapter as scrollable sections. The shell scaffolds an intro + 3 sections + the assessment. For each section you provide:

- **Title** — the section heading.
- **Learning Outcome** — one line: what the reader will understand.
- **Body** — the full prose (this is where long explanation lives).
- **Takeaway** — one memorable line (optional).

Every section needs a matching **TOC link** in the sidebar (the shell shows how — `href` and `data-s` must equal the section's `id`). Add or remove sections + their TOC links to match your chapter.

**Dropping read mode:** if your chapter is slide-only, delete the whole `#read-mode` block and the "Read Full Chapter" button in the top bar. (Not recommended — read mode is how people revisit the material.)

---

## Step 5 — Choose your assessment

Your chapter can end with **any** of these. Decide which fits your content:

| Type | When to use | Effort |
|------|-------------|--------|
| **Open-text questions** (default) | Reflection, "explain in your own words," research tasks | Lowest — already built |
| **Multiple choice (MCQ)** | Checking recall of specific facts | Low — swap the answer inputs (catalog shows how) |
| **File upload** | Ask the learner to submit a deck / audio / document (AM-chapter style) | Medium — uses the upload route; ask admin to help wire |
| **No assessment** | Pure read-only reference chapter | Lowest — delete the assessment section |

The shell ships **open-text with 3 questions**. To change the number of questions, edit the questions in the `#r-assess` form **and** set `TOTAL_QUESTIONS` in the script to match. For MCQ / file upload / no-assessment, follow the **ASSESSMENT VARIANTS** notes at the bottom of the shell — or let the LLM prompt below handle the rewrite.

Good open-text questions: open-ended, no single right answer, reward genuine observation. (e.g. *"Find 3 examples of X and explain why each matters."*)

---

## Step 6 — Images

If your chapter uses images:

1. Put them all in a folder named **`chapter_images/`** next to the HTML file.
2. Name each file so it's **obvious which slot it belongs to.** Use the pattern:
   ```
   <chapterid>-<where>-<what>.jpg
   ```
   Examples:
   - `amch3-cover.jpg` — the cover slide image
   - `amch3-sl2-diagram.png` — image used on slide 2
   - `amch3-read-s01-map.jpg` — image in read-mode section 01
3. Reference them in the shell as `chapter_images/your-file-name.jpg`. The shell's image tags already include `onerror="this.style.display='none'"` so a missing image won't break the layout.
4. Hand the `chapter_images/` folder to the admin **along with the HTML** — the descriptive names make it clear where each image maps.

Keep images reasonably sized (each well under a few MB) so the chapter loads fast.

---

## Step 7 — Check your work

Open the HTML in a browser (ask the admin if you can't run it locally — it needs `firebase-config.js` alongside it). Verify:

- [ ] No `{{...}}` placeholders left anywhere (search the file for `{{`).
- [ ] Every slide shows correctly; arrow keys move between them; the "1 / N" counter is right.
- [ ] Browser zoom in/out (Cmd/Ctrl +/−) keeps the slide looking correct (it should magnify, not distort).
- [ ] Read mode opens, the sidebar links jump to the right sections.
- [ ] The assessment matches your chosen type; the submit button enables only when complete.
- [ ] Every `data-editable` key is unique (prefixed with your chapter id).

Then send the admin: the **HTML file** + the **`chapter_images/` folder**. The admin handles registering the chapter in the hub and content editor.

---

## The LLM prompt (paste this into Claude / ChatGPT)

Attach `chapter-shell.html` and this guide, then paste:

```
You are helping me fill in a chapter template for myHQ's onboarding course.
I'm attaching the shell HTML (chapter-shell.html) and the author guide.

FIRST, ask me these questions and wait for my answers:
1. Chapter id (e.g. amch3), the next chapter's id to unlock (or none),
   the human chapter title, and the Drive folder path for answers.
2. The chapter label shown in the top bar (e.g. "Chapter 3").
3. What is this chapter about? Paste your raw notes / source material.
4. How many slides do you want, and for each, which archetype fits
   (Cover / Big Stat / Timeline / Two Column / Card Grid / Quote)?
   If unsure, suggest a structure from my material.
5. Do you want read mode? (recommended yes)
6. What assessment type: open-text, MCQ, file upload, or none? How many
   questions, and what should they ask?
7. Do you have images? If so, the filenames in chapter_images/.

THEN, follow these rules strictly while filling the shell:
- NEVER modify the scaleSlides() function or any CSS / code marked
  "DO NOT EDIT". Do not change the auth gate or submission logic.
- Only set the 4 CONFIG variables (CHAPTER_ID, NEXT_CHAPTER, CHAPTER_NAME,
  DRIVE_FOLDER) and replace every {{ID}} with my chapter id.
- Build slides by copying archetype blocks from the catalog at the bottom
  of the shell into #slides. Make every data-editable key unique using my
  chapter id + slide number. Inside slides, use fixed px only — never vw,
  vh, %, or clamp().
- Keep slide text short and glanceable; put long prose in read mode.
- Fill read-mode sections + matching TOC links; set the assessment to my
  chosen type and set TOTAL_QUESTIONS to match.
- Remove all {{...}} placeholders and any unused catalog blocks /
  archetype CSS / read mode / assessment variants I'm not using.

OUTPUT the complete, filled chapter-shell.html ready to save. After it,
list: (a) any images I still need to add to chapter_images/, and
(b) anything you need the admin to do.
```

---

## What's out of scope for you

- **Registering the chapter** in the hub / course menu and the admin content editor — the admin does this.
- **Firebase, login, unlock chain, the response Sheet / Drive backend** — already built and shared. Don't change it.
- **The visual design system** — colors, fonts, component styles are locked so all chapters match.

If you think you need any of the above changed, talk to the admin rather than editing the locked code.
