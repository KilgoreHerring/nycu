import Link from "next/link";
import { getAllEditions, getLatestEdition } from "@/lib/editions";
import { EditionBody, EditionHero, ArchiveLink } from "./components/EditionRender";

export default function Home() {
  const edition = getLatestEdition();
  const recent = getAllEditions().filter((e) => e.slug !== edition.slug).slice(0, 3);

  return (
    <main className="pb-20">
      <EditionHero edition={edition} />
      <EditionBody edition={edition} />

      <section className="px-6 pt-6">
        <div className="max-w-5xl mx-auto">
          <div className="brush-rule mb-10" aria-hidden />
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="eyebrow mb-2">Back issues</p>
              <h2 className="font-display text-3xl md:text-4xl text-[#142028] leading-tight tracking-tight">
                Recently <span className="font-display-italic text-[#3f6a7e]">published</span>
              </h2>
            </div>
            <Link
              href="/archive"
              className="text-sm font-display-italic text-[#3a7d78] hover:text-[#8a4a30] transition-colors"
            >
              See the full archive &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recent.map((e) => (
              <ArchiveLink key={e.slug} edition={e} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
