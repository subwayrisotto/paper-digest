import SimilarPapers from "../SimilarPapersComponent/SimilarPapersComponent";
import Link from "next/link";
import LikeButton from "../LikeButtonComponent/LikeButtonComponent";

export default function PaperCard({ paper }: { paper: any }) {
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
}
