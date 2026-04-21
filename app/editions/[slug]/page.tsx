import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllEditions, getEdition } from "@/lib/editions";
import { EditionBody, EditionHero } from "../../components/EditionRender";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllEditions().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const edition = getEdition(slug);
  if (!edition) return { title: "Not found" };
  return {
    title: `${edition.title} \u00B7 News You Can Use`,
    description: edition.hook || `${edition.title}: ${edition.period}`,
  };
}

export default async function EditionPage({ params }: PageProps) {
  const { slug } = await params;
  const edition = getEdition(slug);
  if (!edition) notFound();

  const all = getAllEditions();
  const idx = all.findIndex((e) => e.slug === slug);
  const newer = idx > 0 ? all[idx - 1] : null;
  const older = idx < all.length - 1 ? all[idx + 1] : null;

  return (
    <main className="pb-20">
      <EditionHero edition={edition} />
      <EditionBody edition={edition} />

      <nav className="px-6 pt-8">
        <div className="max-w-4xl mx-auto brush-rule mb-8" aria-hidden />
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {older ? (
            <Link
              href={`/editions/${older.slug}`}
              className="paper-soft p-5 md:p-6 hover:-translate-y-0.5 transition-transform"
            >
              <p className="eyebrow mb-1">&larr; Previous edition</p>
              <p className="font-display text-xl text-[#142028]">
                {older.title}
              </p>
              <p className="text-sm text-[#5b6f7d]">{older.period}</p>
            </Link>
          ) : (
            <div />
          )}
          {newer ? (
            <Link
              href={`/editions/${newer.slug}`}
              className="paper-soft p-5 md:p-6 hover:-translate-y-0.5 transition-transform text-right"
            >
              <p className="eyebrow mb-1">Next edition &rarr;</p>
              <p className="font-display text-xl text-[#142028]">
                {newer.title}
              </p>
              <p className="text-sm text-[#5b6f7d]">{newer.period}</p>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </nav>
    </main>
  );
}
