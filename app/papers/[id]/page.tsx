import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import SimilarPapers from "@/components/SimilarPapersComponent/SimilarPapersComponent";
import LikeButtons from "@/components/LikeButtonsComponent/LikeButtonsComponent";

export default function Paper({ params }: { params: Promise<{ id: string }> }) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-blue-600 text-sm">
        ← Back to feed
      </Link>
      <Suspense fallback={<p className="mt-4">Loading paper...</p>}>
        <PaperDetail params={params} />
      </Suspense>
    </main>
  );
}

async function PaperDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paperId = Number(id);
  if (!Number.isInteger(paperId) || paperId < 1) notFound();

  const rows = await sql`
        SELECT p.id, p.title, p.authors, p.abstract, p.category,
        p.published_at, p.arxiv_id, f.liked
        FROM papers p
        LEFT JOIN feedback f ON f.paper_id = p.id
        WHERE p.id = ${paperId}
      `;
  if (rows.length === 0) notFound();
  const paper = rows[0];

  return (
    <article className="mt-4">
      <h1 className="text-2xl font-bold">{paper.title}</h1>
      <p className="text-gray-600 mt-2">{paper.authors}</p>
      <p className="text-gray-400 text-xs my-1">
        Published at: {new Date(paper.published_at).toLocaleDateString()}
      </p>
      <p className="mt-4 leading-relaxed">{paper.abstract}</p>
      <a
        href={`https://arxiv.org/abs/${paper.arxiv_id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-4 text-blue-600 underline"
      >
        View on arXiv
      </a>

      <LikeButtons paperId={paper.id} initial={paper.liked} />
      <SimilarPapers paperId={paper.id} />
    </article>
  );
}
