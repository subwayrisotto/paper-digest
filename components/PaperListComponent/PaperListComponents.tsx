import { sql } from "@/lib/db";
import SimilarPapers from "../SimilarPapersComponent/SimilarPapersComponent";
import Link from "next/link";
import LikeButton from "../LikeButtonComponent/LikeButtonComponent";
import { cookies } from "next/headers";

export default async function PaperList() {
  const visitorId = (await cookies()).get("visitor_id")?.value ?? "";

  const papers = await sql`
  SELECT p.id, p.title, p.authors, p.category, p.published_at,
    (SELECT count(*)::int FROM likes l WHERE l.paper_id = p.id) AS like_count,
    EXISTS (
      SELECT 1 FROM likes l
      WHERE l.paper_id = p.id AND l.visitor_id = ${visitorId}
    ) AS liked
  FROM papers p
  ORDER BY p.published_at DESC
  LIMIT 20
`;

  return (
    <>
      {papers.map((paper: any) => (
        <PaperCard key={paper.id} paper={paper} />
      ))}
    </>
  );
}

const PaperCard = ({ paper }: { paper: any }) => {
  return (
    <div className="border rounded p-4 mb-4">
      <Link href={`/papers/${paper.id}`}>
        <h2 className="text-xl font-bold">{paper.title}</h2>
      </Link>
      <p className="text-gray-600">{paper.authors}</p>
      <p className="text-gray-400 text-xs mt-4">
        Published at: {new Date(paper.published_at).toLocaleDateString()}
      </p>
      <LikeButton
        paperId={paper.id}
        initialLiked={paper.liked}
        initialCount={paper.like_count}
      />
      <SimilarPapers paperId={paper.id} />
    </div>
  );
};
