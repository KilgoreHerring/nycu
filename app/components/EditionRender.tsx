import Link from "next/link";
import type { DeepDive, Edition, InlineLink, WorthReadingItem } from "@/lib/editions";

const WASH_COLOURS = [
  "rgba(127, 185, 180, 0.32)", // teal
  "rgba(169, 200, 213, 0.32)", // sky
  "rgba(157, 185, 153, 0.32)", // sage
  "rgba(200, 162, 90, 0.22)", // ochre
  "rgba(201, 135, 103, 0.26)", // terracotta
];

export function EditionHero({ edition }: { edition: Edition }) {
  return (
    <section className="px-6 pt-10 pb-10 md:pt-16 md:pb-14">
      <div className="max-w-4xl mx-auto">
        <p className="eyebrow mb-3">
          {edition.title}
          {edition.period ? ` \u00B7 ${edition.period}` : ""}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl leading-[1.02] tracking-tight text-[#142028]">
          News You Can <span className="font-display-italic text-[#3a7d78]">Use</span>
        </h1>
      </div>
    </section>
  );
}

export function OpeningSection({ opening }: { opening?: string }) {
  if (!opening) return null;
  return (
    <section className="px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="paper p-7 md:p-10 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-16 -left-20 w-[120%] h-[140%] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 30% 30%, rgba(127, 185, 180, 0.22), transparent 60%)",
              filter: "blur(8px)",
            }}
          />
          <div className="relative">
            <p className="eyebrow mb-2">Opening</p>
            <div
              className="prose-ink text-base md:text-lg"
              dangerouslySetInnerHTML={{ __html: opening }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function DeepDivesSection({
  deepDives,
  variant = "deepDives",
}: {
  deepDives: DeepDive[];
  variant?: "deepDives" | "themes";
}) {
  if (!deepDives.length) return null;
  const hasRealContent = deepDives.some((d) => d.what || d.soWhat || d.intro);
  if (!hasRealContent) return null;
  const isThemes = variant === "themes";

  return (
    <section className="px-6 pt-4 pb-10 md:pb-16">
      <div className="max-w-5xl mx-auto">
        {!isThemes ? (
          <SectionHeader
            eyebrow="Deep Dives"
            title={
              <>
                Three stories worth <span className="font-display-italic text-[#8a4a30]">sitting with</span>
              </>
            }
          />
        ) : null}
        <div className={`${isThemes ? "" : "mt-10"} space-y-8`}>
          {deepDives.map((d, i) => (
            <DeepDiveCard key={i} dive={d} washIndex={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AccuracyBadge({ rating, note }: { rating: string; note?: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    high: { bg: "#3a7d78", text: "#ffffff" },
    "medium-high": { bg: "#7a8550", text: "#ffffff" },
    medium: { bg: "#c9a66b", text: "#142028" },
    "medium-low": { bg: "#a86a3b", text: "#ffffff" },
    low: { bg: "#8a4a30", text: "#ffffff" },
  };
  const key = rating.toLowerCase().trim();
  const color = colorMap[key] ?? { bg: "#5b6f7d", text: "#ffffff" };
  return (
    <div className="mt-3 inline-flex items-center gap-3 flex-wrap">
      <span
        className="eyebrow not-italic text-xs px-3 py-1 rounded-full"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {rating}
      </span>
      {note ? <span className="text-sm text-[#5b6f7d]">{note}</span> : null}
    </div>
  );
}

function DeepDiveCard({ dive, washIndex }: { dive: DeepDive; washIndex: number }) {
  const wash = WASH_COLOURS[washIndex % WASH_COLOURS.length];
  return (
    <article
      className="paper dive-card p-7 md:p-10"
      style={{ ["--wash-color" as string]: wash }}
    >
      {dive.title ? (
        <h3 className="font-display text-2xl md:text-[1.9rem] leading-snug text-[#142028]">
          {dive.title}
        </h3>
      ) : null}
      {dive.accuracy ? (
        <AccuracyBadge rating={dive.accuracy} note={dive.accuracyNote} />
      ) : null}
      {dive.subtitleLinks?.length ? (
        <p className="mt-2 text-sm text-[#5b6f7d]">
          {dive.subtitleLinks.map((l, idx) => (
            <span key={idx}>
              {idx > 0 ? <span className="mx-1 text-[#c9a66b]">|</span> : null}
              <ExternalLink href={l.url}>{l.label}</ExternalLink>
            </span>
          ))}
        </p>
      ) : null}
      {dive.intro ? (
        <div
          className="prose-ink mt-5 text-[#1f2a33] text-base md:text-lg"
          dangerouslySetInnerHTML={{ __html: dive.intro }}
        />
      ) : null}
      {dive.what || dive.soWhat ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-6 gap-y-5">
          {dive.what ? (
            <>
              <div className="md:pt-1">
                <span className="eyebrow not-italic font-display-italic text-[#3a7d78]">What</span>
              </div>
              <div
                className="prose-ink text-[#1f2a33]"
                dangerouslySetInnerHTML={{ __html: dive.what }}
              />
            </>
          ) : null}
          {dive.soWhat ? (
            <>
              <div className="md:pt-1">
                <span className="eyebrow not-italic font-display-italic text-[#8a4a30]">
                  So what
                </span>
              </div>
              <div
                className="prose-ink text-[#1f2a33]"
                dangerouslySetInnerHTML={{ __html: dive.soWhat }}
              />
            </>
          ) : null}
        </div>
      ) : null}
      {dive.sources?.length ? (
        <div className="mt-6 pt-4 border-t border-[#dde6e6] text-sm text-[#5b6f7d]">
          <span className="eyebrow not-italic mr-2">Sources</span>
          {dive.sources.map((l, idx) => (
            <span key={idx}>
              {idx > 0 ? <span className="mx-1 text-[#c9a66b]">|</span> : null}
              <ExternalLink href={l.url}>{l.label}</ExternalLink>
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function WorthReadingSection({
  items,
  title = "Worth Reading",
  blurb,
}: {
  items: WorthReadingItem[];
  title?: string;
  blurb?: string;
}) {
  if (!items.length) return null;
  const groups = groupByGroup(items);

  return (
    <section className="px-6 pt-6 pb-10 md:pb-16">
      <div className="max-w-5xl mx-auto">
        <SectionHeader
          eyebrow={title}
          title={
            <>
              Everything else <span className="font-display-italic text-[#3f6a7e]">worth a click</span>
            </>
          }
          body={blurb}
        />
        <div className="mt-10 space-y-10">
          {groups.map((g, gi) => (
            <div key={gi}>
              {g.group ? (
                <h3 className="font-display text-xl md:text-2xl text-[#142028] mb-4 tracking-tight">
                  <span className="font-display-italic text-[#8a4a30]">-</span> {g.group}
                </h3>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {g.items.map((item, i) => (
                  <WorthReadingCard key={i} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function groupByGroup(items: WorthReadingItem[]) {
  const out: { group?: string; items: WorthReadingItem[] }[] = [];
  for (const item of items) {
    const last = out[out.length - 1];
    if (last && last.group === item.group) {
      last.items.push(item);
    } else {
      out.push({ group: item.group, items: [item] });
    }
  }
  return out;
}

function WorthReadingCard({ item }: { item: WorthReadingItem }) {
  return (
    <article className="paper-soft p-5 md:p-6 flex flex-col">
      <h4 className="font-display text-lg md:text-xl leading-snug text-[#142028]">
        {item.url ? (
          <ExternalLink href={item.url} className="brush-link">
            {item.title}
          </ExternalLink>
        ) : (
          item.title
        )}
      </h4>
      {item.body ? (
        <div
          className="prose-ink mt-2 text-sm md:text-[0.95rem] text-[#1f2a33]"
          dangerouslySetInnerHTML={{ __html: item.body }}
        />
      ) : null}
    </article>
  );
}

export function LegacyBody({ html }: { html: string }) {
  return (
    <section className="px-6 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="paper p-7 md:p-10">
          <p className="eyebrow mb-3">Edition archive</p>
          <div className="prose-ink" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: React.ReactNode;
  body?: string;
}) {
  return (
    <div>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-display text-3xl md:text-4xl text-[#142028] leading-tight tracking-tight">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 text-base md:text-lg text-[#1f2a33] leading-relaxed max-w-4xl">
          {body}
        </p>
      ) : null}
    </div>
  );
}

function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "hover:text-[#8a4a30] transition-colors"}
    >
      {children}
    </a>
  );
}

// Suppress unused-import lint for types that are used only as prop types above.
export type { InlineLink };

// Home/edition page shell that renders all sections in order.
export function EditionBody({ edition }: { edition: Edition }) {
  if (edition.format === "legacy" && edition.deepDives.every((d) => !d.what && !d.soWhat)) {
    return <LegacyBody html={edition.rawHtml} />;
  }
  const variant = edition.format === "special" ? "themes" : "deepDives";
  return (
    <>
      <OpeningSection opening={edition.opening} />
      <DeepDivesSection deepDives={edition.deepDives} variant={variant} />
      <WorthReadingSection items={edition.worthReading} />
    </>
  );
}

export function ArchiveLink({ edition }: { edition: Edition }) {
  return (
    <Link href={`/editions/${edition.slug}`} className="group block paper p-5 md:p-6 hover:-translate-y-0.5 transition-transform">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-display text-2xl md:text-3xl text-[#142028]">
          {edition.title}
        </span>
        <span className="eyebrow text-sm">{edition.period}</span>
      </div>
      {edition.hook ? (
        <p className="mt-3 text-[#1f2a33] leading-relaxed text-sm md:text-base line-clamp-4 group-hover:text-[#142028]">
          {edition.hook}
        </p>
      ) : null}
      <p className="mt-4 text-sm font-display-italic text-[#3a7d78] group-hover:text-[#8a4a30] transition-colors">
        Read edition &rarr;
      </p>
    </Link>
  );
}
