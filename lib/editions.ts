import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

export type DeepDive = {
  title: string;
  subtitleLinks?: InlineLink[]; // the "[Link](url)" or "[source](url) | [source](url)" line after the title
  intro?: string; // HTML, intro paragraph before What/So What (or full body for specials)
  what?: string; // HTML
  soWhat?: string; // HTML
  accuracy?: string; // e.g. "High" - rating for special edition retrospectives
  accuracyNote?: string; // e.g. "Timing & Impact" - descriptor alongside the rating
  sources?: InlineLink[];
};

export type InlineLink = { label: string; url: string };

export type WorthReadingItem = {
  group?: string; // grouping header if present
  title: string;
  url?: string;
  body: string; // HTML
  extraLinks?: InlineLink[];
};

export type Edition = {
  slug: string; // "edition-37"
  number: number;
  title: string; // "Edition 37"
  suffix?: string; // "NYCU"
  period: string; // "1st - 14th March 2026"
  dateStart: string; // ISO
  dateEnd: string; // ISO
  hook: string; // first sentence of opening or first line of body
  opening?: string; // HTML
  deepDives: DeepDive[];
  worthReading: WorthReadingItem[];
  notInEdition?: WorthReadingItem[];
  format: "modern" | "legacy" | "special";
  rawHtml: string; // full markdown rendered as HTML (fallback)
};

const CONTENT_DIR = path.join(process.cwd(), "content", "editions");

// --------- helpers ----------

function renderInline(md: string): string {
  return marked.parseInline(md, { async: false }) as string;
}

function renderBlock(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

function extractLinks(md: string): InlineLink[] {
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  const out: InlineLink[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    out.push({ label: m[1], url: m[2] });
  }
  return out;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function firstSentence(html: string, max = 180): string {
  const stripped = html.replace(/<[^>]+>/g, "").trim();
  const text = decodeEntities(stripped);
  if (!text) return "";
  const cut = text.match(/.+?[.!?](\s|$)/);
  const sentence = cut ? cut[0].trim() : text;
  if (sentence.length <= max) return sentence;
  return sentence.slice(0, max - 1).trimEnd() + "\u2026";
}

function parsePeriodToIso(period: string): { dateStart: string; dateEnd: string } {
  // "1st - 14th March 2026" or "15th - 31st Jan 2025"
  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };
  const rangeMatch = period.match(/(\d+)\w*\s*[-–]\s*(\d+)\w*\s+(\w+)\s+(\d{4})/);
  if (rangeMatch) {
    const [, d1, d2, monStr, yr] = rangeMatch;
    const mon = months[monStr.toLowerCase()];
    if (mon === undefined) return { dateStart: "", dateEnd: "" };
    const y = parseInt(yr, 10);
    const start = new Date(Date.UTC(y, mon, parseInt(d1, 10)));
    const end = new Date(Date.UTC(y, mon, parseInt(d2, 10)));
    return {
      dateStart: start.toISOString().slice(0, 10),
      dateEnd: end.toISOString().slice(0, 10),
    };
  }
  // Single-date fallback: "1st January 2025"
  const singleMatch = period.match(/(\d+)\w*\s+(\w+)\s+(\d{4})/);
  if (singleMatch) {
    const [, d, monStr, yr] = singleMatch;
    const mon = months[monStr.toLowerCase()];
    if (mon === undefined) return { dateStart: "", dateEnd: "" };
    const y = parseInt(yr, 10);
    const date = new Date(Date.UTC(y, mon, parseInt(d, 10)));
    const iso = date.toISOString().slice(0, 10);
    return { dateStart: iso, dateEnd: iso };
  }
  return { dateStart: "", dateEnd: "" };
}

function periodFromFilename(filename: string): string {
  // "10th Edition - 15th - 31st Jan 2025" -> "15th - 31st Jan 2025"
  const m = filename.match(/\d+\w+\s+Edition\s*-\s*(.+?)(?:\.md)?$/i);
  return m ? m[1].trim() : "";
}

// --------- parser ----------

export function parseEdition(raw: string, slug: string): Edition {
  // Non-numeric slugs (e.g. "edition-special") get a fractional number so
  // they sort into the right chronological position between numbered editions.
  // Primary sort is by dateStart, so this is just a fallback / tiebreaker.
  const isSpecial = /special/i.test(slug);
  const SPECIAL_NUMBERS: Record<string, number> = {
    "edition-special": 8.5, // Jan 2025 predictions
    "edition-special-2025-review": 32.4, // Jan 2026 review of 2025
    "edition-special-2026-predictions": 32.6, // Jan 2026 predictions for 2026
  };
  const numberFromSlug = isSpecial
    ? (SPECIAL_NUMBERS[slug] ?? 8.5)
    : parseInt(slug.replace(/[^\d]/g, ""), 10);
  const lines = raw.split(/\r?\n/);

  // Title & period
  let title = isSpecial ? "Special Edition" : `Edition ${numberFromSlug}`;
  let suffix: string | undefined;
  let period = "";

  const firstLine = lines[0]?.trim() || "";
  const h1Match = firstLine.match(/^#\s*Edition\s+(\d+)\s*(?:-\s*(.+))?$/i);
  const specialMatch = firstLine.match(/^Special Edition\s*-\s*(.+)$/i);
  if (h1Match) {
    title = `Edition ${h1Match[1]}`;
    suffix = h1Match[2]?.trim();
  } else if (specialMatch) {
    title = "Special Edition";
    period = specialMatch[1].trim();
  } else {
    // Legacy: "20th Edition - 15th - 30th June 2025"
    const legacyMatch = firstLine.match(/^(\d+\w+)\s+Edition\s*-\s*(.+)$/i);
    if (legacyMatch) {
      period = legacyMatch[2].trim();
    }
  }

  // Look for "**Period:**" line
  if (!period) {
    const periodLine = lines.find((l) => /\*\*Period:\*\*/i.test(l));
    if (periodLine) {
      period = periodLine.replace(/\*\*Period:\*\*/i, "").trim();
    }
  }
  if (!period) {
    // Try to recover from original filename stored via slug mapping (handled upstream); leave blank
  }
  const { dateStart, dateEnd } = parsePeriodToIso(period);

  const hasModernMarkers = /^##\s+(Opening|Deep Dives|Worth Reading)/m.test(raw);
  const format: "modern" | "legacy" | "special" = isSpecial
    ? "special"
    : hasModernMarkers
      ? "modern"
      : "legacy";

  const rawHtml = renderBlock(raw);

  if (format === "special") {
    return parseSpecial(raw, slug, numberFromSlug, title, suffix, period, dateStart, dateEnd, rawHtml);
  }
  if (format === "modern") {
    return parseModern(raw, slug, numberFromSlug, title, suffix, period, dateStart, dateEnd, rawHtml);
  }
  return parseLegacy(raw, slug, numberFromSlug, title, suffix, period, dateStart, dateEnd, rawHtml);
}

function parseModern(
  raw: string,
  slug: string,
  number: number,
  title: string,
  suffix: string | undefined,
  period: string,
  dateStart: string,
  dateEnd: string,
  rawHtml: string,
): Edition {
  const sections = splitByH2(raw);

  const openingMd = sections.get("Opening") ?? "";
  const deepDivesMd = sections.get("Deep Dives") ?? "";
  const worthReadingMd = sections.get("Worth Reading") ?? "";
  const notInEditionMd =
    sections.get("Didn't Make the Cut") ??
    sections.get("Didn\u2019t Make the Cut") ??
    "";

  const opening = openingMd ? renderBlock(openingMd).trim() : undefined;
  const deepDives = parseDeepDives(deepDivesMd);
  const worthReading = parseWorthReading(worthReadingMd);
  const notInEdition = notInEditionMd ? parseWorthReading(notInEditionMd) : undefined;

  const hook = firstSentence(opening ?? deepDives[0]?.intro ?? rawHtml);

  return {
    slug,
    number,
    title,
    suffix,
    period,
    dateStart,
    dateEnd,
    hook,
    opening,
    deepDives,
    worthReading,
    notInEdition,
    format: "modern",
    rawHtml,
  };
}

function parseSpecial(
  raw: string,
  slug: string,
  number: number,
  title: string,
  suffix: string | undefined,
  period: string,
  dateStart: string,
  dateEnd: string,
  rawHtml: string,
): Edition {
  // Drop the first line (e.g. "Special Edition - 1st January 2026")
  const body = raw.split(/\r?\n/).slice(1).join("\n").trim();

  // Split off Worth Reading if present
  const wrMatch = body.match(/(^|\n)Worth\s+Reading\s*:?\s*\n/i);
  let themesPart = body;
  let worthPart = "";
  if (wrMatch) {
    const idx = body.indexOf(wrMatch[0]) + wrMatch[0].length;
    themesPart = body.slice(0, idx - wrMatch[0].length).trim();
    worthPart = body.slice(idx).trim();
  }

  const blocks = themesPart.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);

  const isThemeTitle = (block: string): boolean => {
    const lines = block.split(/\n/).map((l) => l.trim());
    if (lines.length !== 1) return false;
    const line = lines[0];
    if (!line) return false;
    if (/^[-*]\s/.test(line)) return false;
    if (/^accuracy\s*:/i.test(line)) return false;
    if (line.length > 100) return false;
    return true;
  };

  let opening: string | undefined;
  const themes: DeepDive[] = [];
  let i = 0;

  // First non-title block is the opening blurb
  if (blocks.length > 0 && !isThemeTitle(blocks[0])) {
    opening = renderBlock(blocks[0]).trim();
    i = 1;
  }

  while (i < blocks.length) {
    if (!isThemeTitle(blocks[i])) {
      i++;
      continue;
    }
    const themeTitle = blocks[i].trim();
    i++;

    let accuracy: string | undefined;
    let accuracyNote: string | undefined;
    if (i < blocks.length && /^accuracy\s*:/i.test(blocks[i])) {
      const accMatch = blocks[i].match(/^accuracy\s*:\s*([^|]+?)(?:\s*\|\s*(.+))?$/i);
      if (accMatch) {
        accuracy = accMatch[1].trim();
        accuracyNote = accMatch[2]?.trim();
      }
      i++;
    }

    const contentBlocks: string[] = [];
    while (i < blocks.length && !isThemeTitle(blocks[i])) {
      contentBlocks.push(blocks[i]);
      i++;
    }

    themes.push({
      title: themeTitle,
      accuracy,
      accuracyNote,
      intro: contentBlocks.length > 0 ? renderBlock(contentBlocks.join("\n\n")).trim() : undefined,
    });
  }

  const worthReading = worthPart ? parseLegacyWorthReading(worthPart) : [];
  const hook = firstSentence(opening ?? themes[0]?.intro ?? rawHtml);

  return {
    slug,
    number,
    title,
    suffix,
    period,
    dateStart,
    dateEnd,
    hook,
    opening,
    deepDives: themes,
    worthReading,
    format: "special",
    rawHtml,
  };
}

function parseLegacy(
  raw: string,
  slug: string,
  number: number,
  title: string,
  suffix: string | undefined,
  period: string,
  dateStart: string,
  dateEnd: string,
  rawHtml: string,
): Edition {
  // Drop the first line (the title header like "20th Edition - 15th - 30th June 2025")
  const body = raw.split(/\r?\n/).slice(1).join("\n").trim();

  // Try to split off "Worth Reading" at the end
  const wrMatch = body.match(/(^|\n)Worth\s+Reading\s*:?\s*\n/i);
  let deepPart = body;
  let worthPart = "";
  if (wrMatch) {
    const idx = body.indexOf(wrMatch[0]) + wrMatch[0].length;
    deepPart = body.slice(0, idx - wrMatch[0].length).trim();
    worthPart = body.slice(idx).trim();
  }

  const deepDives = parseLegacyDeepDives(deepPart);
  const worthReading = worthPart ? parseLegacyWorthReading(worthPart) : [];

  // For legacy editions: no opening section, so use the first dive's What as the hook
  const hookSource =
    deepDives[0]?.intro ?? deepDives[0]?.what ?? rawHtml;
  const hook = firstSentence(hookSource);

  return {
    slug,
    number,
    title,
    suffix,
    period,
    dateStart,
    dateEnd,
    hook,
    deepDives,
    worthReading,
    format: "legacy",
    rawHtml,
  };
}

// --------- section splitter ----------

function splitByH2(raw: string): Map<string, string> {
  const result = new Map<string, string>();
  const lines = raw.split(/\r?\n/);
  let current: string | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (current) result.set(current, buf.join("\n").trim());
    buf = [];
  };
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      flush();
      current = m[1].trim();
    } else if (current) {
      buf.push(line);
    }
  }
  flush();
  return result;
}

// --------- modern deep dives ----------

function parseDeepDives(md: string): DeepDive[] {
  if (!md) return [];
  // Split on "### "
  const parts = md.split(/\n(?=###\s+)/g).map((p) => p.trim()).filter(Boolean);
  return parts.map(parseSingleDeepDive).filter(Boolean) as DeepDive[];
}

function parseSingleDeepDive(chunk: string): DeepDive | null {
  const lines = chunk.split(/\r?\n/);
  const titleLine = lines.shift() || "";
  const titleMatch = titleLine.match(/^###\s+(.+?)\s*$/);
  if (!titleMatch) return null;
  const title = titleMatch[1].trim();

  // Optional next non-empty line may be a link bar like "[Link](url)" or "[X](u) | [Y](u)"
  let idx = 0;
  while (idx < lines.length && !lines[idx].trim()) idx++;
  let subtitleLinks: InlineLink[] | undefined;
  if (idx < lines.length) {
    const l = lines[idx].trim();
    if (/^\[.+?\]\(.+?\)(\s*\|\s*\[.+?\]\(.+?\))*\s*$/.test(l)) {
      subtitleLinks = extractLinks(l);
      idx++;
    }
  }

  // Remaining body
  const rest = lines.slice(idx).join("\n").trim();

  // Extract Sources line (last "**Sources:**" paragraph)
  let sources: InlineLink[] | undefined;
  let body = rest;
  const srcMatch = rest.match(/(^|\n)\*\*Sources?:\*\*\s*([\s\S]+?)\s*$/i);
  if (srcMatch) {
    sources = extractLinks(srcMatch[2]);
    body = rest.slice(0, rest.indexOf(srcMatch[0])).trim();
  }

  // Split body into intro (before first "- **What") and the bullet block
  const whatIdx = body.search(/(^|\n)-\s*\*\*What/i);
  let intro: string | undefined;
  let bulletBlock = body;
  if (whatIdx >= 0) {
    const introMd = body.slice(0, whatIdx).trim();
    bulletBlock = body.slice(whatIdx).trim();
    if (introMd) intro = renderBlock(introMd).trim();
  } else if (body) {
    intro = renderBlock(body).trim();
    bulletBlock = "";
  }

  let what: string | undefined;
  let soWhat: string | undefined;
  if (bulletBlock) {
    // Split bullet block on "- **" at line starts
    const bullets = bulletBlock.split(/\n(?=-\s*\*\*)/g);
    for (const b of bullets) {
      const bm = b.match(/^-\s*\*\*(What|So what|So-what|So What)[:\s]*\*\*[:\s]*([\s\S]*)$/i);
      if (!bm) continue;
      const label = bm[1].toLowerCase();
      const content = bm[2].trim();
      const html = renderInline(content);
      if (label === "what") what = html;
      else soWhat = html;
    }
  }

  return { title, subtitleLinks, intro, what, soWhat, sources };
}

// --------- worth reading (modern) ----------

function parseWorthReading(md: string): WorthReadingItem[] {
  if (!md) return [];
  const lines = md.split(/\r?\n/);
  const items: WorthReadingItem[] = [];
  let group: string | undefined;
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;
    const gh = line.match(/^###\s+(.+)$/);
    if (gh) {
      group = gh[1].trim();
      continue;
    }
    const bm = line.match(/^-\s+(.+)$/);
    if (!bm) continue;
    const rest = bm[1];

    // Pattern A: "**[Title](url):** description" or "**[Title](url)**: description"
    let m = rest.match(/^\*\*\[([^\]]+)\]\(([^)]+)\)[:]?\*\*[:\s]*([\s\S]*)$/);
    // Pattern B: "[Title](url): description" or "[Title](url) - description"
    if (!m) m = rest.match(/^\[([^\]]+)\]\(([^)]+)\)[:\s-]+([\s\S]*)$/);
    if (m) {
      const [, t, u, rawBody] = m;
      let bodyMd = rawBody.trim();
      // Strip trailing lone colon artefact
      bodyMd = bodyMd.replace(/^:\s*/, "");
      const body = renderInline(bodyMd);
      const extraLinks = extractLinks(bodyMd).filter((l) => l.url !== u);
      items.push({ group, title: t, url: u, body, extraLinks });
      continue;
    }

    // Pattern C: "**Title**: description" (no hyperlink on title)
    m = rest.match(/^\*\*([^*]+)\*\*[:\s]*([\s\S]*)$/);
    if (m) {
      const [, t, rawBody] = m;
      const body = renderInline(rawBody.trim());
      const extraLinks = extractLinks(rawBody);
      items.push({ group, title: t, body, extraLinks });
      continue;
    }

    // Pattern D: Plain bulleted sentence with embedded link
    const firstLink = extractLinks(rest)[0];
    if (firstLink) {
      items.push({
        group,
        title: firstLink.label,
        url: firstLink.url,
        body: renderInline(rest),
        extraLinks: extractLinks(rest).slice(1),
      });
      continue;
    }
    items.push({ group, title: "", body: renderInline(rest) });
  }
  return items;
}

// --------- legacy deep dives ----------

function parseLegacyDeepDives(md: string): DeepDive[] {
  // Legacy editions pair a preceding title block with a "- What:" / "- So what:" bullet pair.
  // Titles come in several shapes:
  //   * "UK Gov AI Action Plan" (plain line)
  //   * "[Salesforce CEO](https://...)" or "AGI ([Sam Altman](...) + [Gary Marcus](...))"
  //   * "- AI is breaking the law firm pyramid model:" (bullet, children nested)
  //   * "**Harvey x RSGI Impact Report**:" (bold)
  //   * "[**Title**](url):" (bold link)
  // Legacy stories have no intro - the What/So-what bullets ARE the dive.

  const lines = md.split(/\r?\n/);
  const isWhat = (s: string) => /^\s*(?:-|\*)\s*(?:\*\*)?what\b/i.test(s);
  const isSoWhat = (s: string) =>
    /^\s*(?:-|\*)\s*(?:\*\*)?so[-\s]*what\b/i.test(s);

  // Find every What bullet position
  const whatPositions: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (isWhat(lines[i])) whatPositions.push(i);
  }

  if (whatPositions.length === 0) {
    const html = renderBlock(md);
    if (!html.trim()) return [];
    return [{ title: "", intro: html }];
  }

  // Pre-compute each dive's title position so we can cap the preceding
  // dive's So-what content before it (otherwise the next title gets
  // captured as continuation text).
  const titleIdxForDive: number[] = whatPositions.map((whatIdx, s) => {
    const prevStoryEnd = s > 0 ? whatPositions[s - 1] : -1;
    for (let k = whatIdx - 1; k > prevStoryEnd; k--) {
      const line = lines[k];
      if (!line.trim()) continue;
      if (isWhat(line) || isSoWhat(line)) continue;
      return k;
    }
    return -1;
  });

  const deepDives: DeepDive[] = [];

  for (let s = 0; s < whatPositions.length; s++) {
    const whatIdx = whatPositions[s];
    const titleIdx = titleIdxForDive[s];

    let title = "";
    if (titleIdx >= 0) {
      title = cleanLegacyTitle(lines[titleIdx]);
    }

    // Cap content at the next dive's title (if any) rather than its
    // What bullet, so titles between dives are not absorbed.
    const hardBoundary =
      s + 1 < whatPositions.length ? whatPositions[s + 1] : lines.length;
    const nextTitleIdx = titleIdxForDive[s + 1];
    const contentEnd =
      typeof nextTitleIdx === "number" && nextTitleIdx > whatIdx
        ? nextTitleIdx
        : hardBoundary;

    let soWhatIdx = -1;
    for (let k = whatIdx + 1; k < contentEnd; k++) {
      if (isSoWhat(lines[k])) {
        soWhatIdx = k;
        break;
      }
    }

    const whatEnd = soWhatIdx >= 0 ? soWhatIdx : contentEnd;
    const whatContent = extractBulletContent(lines.slice(whatIdx, whatEnd));
    let soWhatContent = "";
    if (soWhatIdx >= 0) {
      soWhatContent = extractBulletContent(lines.slice(soWhatIdx, contentEnd));
    }

    // If the title line contains a bare link that looks like a source, expose as subtitleLinks too
    const subtitleLinks = titleIdx >= 0 ? extractLinks(lines[titleIdx]) : [];

    deepDives.push({
      title,
      subtitleLinks: subtitleLinks.length ? subtitleLinks : undefined,
      what: whatContent ? renderInline(whatContent) : undefined,
      soWhat: soWhatContent ? renderInline(soWhatContent) : undefined,
    });
  }

  return deepDives;
}

function cleanLegacyTitle(raw: string): string {
  let s = raw.trim();
  // Strip leading bullet markers (require whitespace so we don't eat **bold** openings)
  s = s.replace(/^[-*]\s+/, "");
  // Strip trailing ":" and surrounding whitespace
  s = s.replace(/[:\s]+$/, "");
  // "[**Text**](url)" -> "Text"
  s = s.replace(/\[\*\*([^\]*]+)\*\*\]\([^)]*\)/g, "$1");
  // "[Text](url)" -> "Text"
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // "**Text**" -> "Text"
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function extractBulletContent(bulletLines: string[]): string {
  if (!bulletLines.length) return "";
  // First line: strip leading "- **What:**" / "- What:" prefix
  const first = bulletLines[0].replace(
    /^\s*[-*]\s*(?:\*\*)?(?:what|so[-\s]*what)(?:\*\*)?[:\s]*/i,
    "",
  );
  const rest = bulletLines
    .slice(1)
    // Only include indented continuation lines, not sibling bullets
    .filter((l) => l.trim() && !/^[-*]\s/.test(l))
    .map((l) => l.trim());
  return [first.trim(), ...rest].filter(Boolean).join(" ").trim();
}

// --------- legacy worth reading ----------

function parseLegacyWorthReading(md: string): WorthReadingItem[] {
  const lines = md.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items: WorthReadingItem[] = [];
  for (const line of lines) {
    const bm = line.match(/^-\s+(.+)$/);
    if (!bm) continue;
    const rest = bm[1];
    const links = extractLinks(rest);
    if (links.length > 0) {
      const main = links[0];
      // Strip the first [label](url) from body
      const body = renderInline(
        rest.replace(/\[[^\]]+\]\([^)]+\)/, "").replace(/^[:\s-]+/, "").trim(),
      );
      items.push({
        title: main.label,
        url: main.url,
        body,
        extraLinks: links.slice(1),
      });
    } else {
      items.push({ title: rest, body: "" });
    }
  }
  return items;
}

// --------- public API ----------

export function getAllEditions(): Edition[] {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const editions = files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const slug = file.replace(/\.md$/, "");
    return parseEdition(raw, slug);
  });
  editions.sort((a, b) => {
    // Primary: dateStart (newest first)
    if (a.dateStart && b.dateStart && a.dateStart !== b.dateStart) {
      return b.dateStart.localeCompare(a.dateStart);
    }
    // Tiebreaker: dateEnd (newest end first) - puts fortnightlies before single-day specials on shared start
    if (a.dateEnd && b.dateEnd && a.dateEnd !== b.dateEnd) {
      return b.dateEnd.localeCompare(a.dateEnd);
    }
    // Fallback: number
    return b.number - a.number;
  });
  return editions;
}

export function getEdition(slug: string): Edition | undefined {
  return getAllEditions().find((e) => e.slug === slug);
}

export function getLatestEdition(): Edition {
  return getAllEditions()[0];
}
