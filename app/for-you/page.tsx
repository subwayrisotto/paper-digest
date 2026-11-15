import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getForYou } from "@/lib/papers";
import PaperCard from "@/components/PaperCardComponent/PaperCardComponent";
import Pagination from "@/components/PaginationComponent/PaginationComponent";

export default function ForYou({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="text-blue-600 text-sm">
          ← Back to feed
        </Link>
        <h1 className="text-2xl font-bold">For you</h1>
      </div>
      <Suspense fallback={<p className="mt-4">Loading recommendations...</p>}>
        <ForYouList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ForYouList({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);

  const visitorId = (await cookies()).get("visitor_id")?.value ?? "";
  const { papers, personalized, totalPages } = await getForYou(
    visitorId,
    current,
  );

  if (papers.length === 0) {
    return (
      <p className="mt-2 text-gray-600">
        No recommendations on this page.{" "}
        <Link href="/for-you" className="text-blue-600 underline">
          Back to page 1
        </Link>
      </p>
    );
  }

  return (
    <>
      {!personalized && (
        <p className="mb-4 text-gray-600">
          Like a few papers to personalize this feed. Showing the newest for
          now.
        </p>
      )}
      <Pagination
        currentPage={current}
        totalPages={totalPages}
        basePath="/for-you"
      />
      {papers.map((paper: any) => (
        <PaperCard key={paper.id} paper={paper} />
      ))}
    </>
  );
}
