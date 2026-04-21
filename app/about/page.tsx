export const metadata = {
  title: "About \u00B7 News You Can Use",
};

export default function AboutPage() {
  return (
    <main className="pb-20">
      <section className="px-6 pt-10 md:pt-16 pb-10">
        <div className="max-w-3xl mx-auto">
          <p className="eyebrow mb-3">About</p>
          <h1 className="font-display text-4xl md:text-5xl text-[#142028] leading-tight tracking-tight">
            A fortnightly <span className="font-display-italic text-[#3a7d78]">field note</span>
          </h1>
          <div className="prose-ink mt-8 text-lg leading-relaxed">
            <p>
              News You Can Use is a fortnightly read on legal AI: what is moving in the
              market, what the research is actually saying, and what the people doing the
              work are learning.
            </p>
            <p>
              Each edition opens with two or three stories worth sitting with, then rounds
              off with a curated list of everything else worth a click. No vendor copy, no
              hype cycles, no press releases masquerading as analysis.
            </p>
            <p>
              Brought to you by <a href="https://www.linkedin.com/in/michaelkenn/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#8a4a30] transition-colors">Mike Kennedy</a>.
            </p>
            <p>
              For the latest stats across legal tech, check out <a href="https://legaltechstats.vercel.app" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#8a4a30] transition-colors">The Signal</a>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
