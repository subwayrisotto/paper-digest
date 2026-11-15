import { sql } from "@/lib/db";
import { cookies } from "next/headers";
import Link from "next/link";
import PaperCard from "../PaperCardComponent/PaperCardComponent";
import Pagination from "../PaginationComponent/PaginationComponent";

const PAGE_SIZE = 20;

export default async function PaperList({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const offset = (current - 1) * PAGE_SIZE;

  const visitorId = (await cookies()).get("visitor_id")?.value ?? "";

  const [papers, totalRows] = await Promise.all([
    sql`
      SELECT p.id, p.title, p.authors, p.category, p.published_at,
        (SELECT count(*)::int FROM likes l WHERE l.paper_id = p.id) AS like_count,
        EXISTS (
          SELECT 1 FROM likes l
          WHERE l.paper_id = p.id AND l.visitor_id = ${visitorId}
        ) AS liked
      FROM papers p
      ORDER BY p.published_at DESC, p.id DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    sql`SELECT count(*)::int AS count FROM papers`,
  ]);

  const totalPages = Math.ceil(totalRows[0].count / PAGE_SIZE);

  if (papers.length === 0) {
    return (
      <p className="text-gray-600">
        No papers on this page.{" "}
        <Link href="/" className="text-blue-600 underline">
          Back to page 1
        </Link>
      </p>
    );
  }

  return (
    <>
      <Pagination currentPage={current} totalPages={totalPages} basePath="/" />
      {papers.map((paper: any) => (
        <PaperCard key={paper.id} paper={paper} />
      ))}
    </>
  );
}
