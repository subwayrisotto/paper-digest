import { sql } from "@/lib/db";
import SimilarPapers from "../SimilarPapersComponent/SimilarPapersComponent";
import Link from "next/link";
import LikeButtons from "../LikeButtonsComponent/LikeButtonsComponent";

export default async function PaperList() {
  const papers = await sql`
    SELECT p.id, p.title, p.authors, p.category, p.published_at, f.liked
    FROM papers p
    LEFT JOIN feedback f ON f.paper_id = p.id
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
      <LikeButtons paperId={paper.id} initial={paper.liked} />
      <SimilarPapers paperId={paper.id} />
    </div>
  );
};
