import { sql } from "@/lib/db";
import SimilarPapers from "../SimilarPapersComponent/SimilarPapersComponent";

export default async function PaperList() {
  const papers = await sql`
    SELECT id, title, authors, category, published_at
    FROM papers
    ORDER BY published_at DESC
    LIMIT 20`;

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
      <h2 className="text-xl font-bold">{paper.title}</h2>
      <p className="text-gray-600">{paper.authors}</p>
      <div>
        <p className="text-gray-400 text-xs">
          Published at: {new Date(paper.published_at).toLocaleDateString()}
        </p>
        <SimilarPapers paperId={paper.id} />
      </div>
    </div>
  );
};
