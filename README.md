# News You Can Use

A public-facing archive and reader for the fortnightly legal-AI newsletter *News You Can Use*, edited by Mike Kennedy.

Live: *(set after Vercel deploy)*

## What this is

A static Next.js site that parses the newsletter archive from markdown and renders:

- **`/`** - the current edition in full (latest by number)
- **`/archive`** - every edition, grouped by year
- **`/editions/[slug]`** - any individual edition
- **`/about`** - short about page

The aesthetic is paper cards on a soft watercolour wash (teal, sage, sky, ochre) with Fraunces serif headings and Inter body. Each deep dive card has a painterly colour bleed from one corner.

## Tech

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS v4
- `marked` for markdown rendering
- No database, no CMS - content is a folder of `.md` files parsed at build time

## Adding or updating an edition

Editions live in `content/editions/` as `edition-{N}.md`. Two formats are supported:

**Modern (preferred)** - used from edition 35 onwards:

```markdown
# Edition 39 - NYCU
**Period:** 1st - 14th April 2026

## Opening

Two or three paragraphs framing the edition.

## Deep Dives

### Title of the first story
[Source A](https://...) | [Source B](https://...)

Optional intro paragraph.

- **What:** Description of what happened.
- **So what:** Why it matters.

**Sources:** [Source A](https://...) | [Source B](https://...)

### Title of the second story
...

## Worth Reading

- **[Link Title](https://...):** One-line summary.
- **[Another Link](https://...):** ...

### Optional subgroup heading

- **[Grouped Link](https://...):** ...
```

**Legacy** - used for editions 9-34, parsed leniently. No intros, just three `What` / `So what` stories followed by a `Worth Reading:` list.

Drop the file in `content/editions/`, commit, and Vercel will redeploy with the new edition as the home page.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000 (or whichever port Next.js picks if 3000 is busy).

## Project layout

```
app/
  page.tsx                      # home (latest edition)
  archive/page.tsx              # grouped archive
  editions/[slug]/page.tsx      # single edition
  about/page.tsx
  components/EditionRender.tsx  # hero, deep-dive cards, worth-reading grid
  globals.css                   # watercolour palette, paper cards, prose styles
  layout.tsx                    # site header, footer, fonts

lib/
  editions.ts                   # markdown -> Edition objects (modern + legacy parsers)

content/
  editions/                     # one markdown file per edition
```

## Deploy

Import `KilgoreHerring/nycu` into Vercel. Default Next.js build settings work as-is - no environment variables, no config changes required. Each commit to `main` ships to production.
