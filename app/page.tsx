import PaperList from "@/components/PaperListComponent/PaperListComponents";
import Link from "next/link";
import { Suspense } from "react";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Paper Digest</h1>
        <Link
          href="/for-you"
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          For You
        </Link>
      </div>
      <div className="mb-4">
        <p className="text-gray-600">
          Welcome to Paper Digest! Explore the latest research papers and
          discover new insights. Click on a paper title to view details, like
          papers you find interesting, and get personalized recommendations in
          the "For You" section.
        </p>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">Latest Papers</h2>
      </div>
      <div className="mb-4">
        <p className="text-gray-600">
          Here are some of the most recent papers added to our collection:
        </p>
      </div>
      <Suspense fallback={<p>Loading papers...</p>}>
        <PaperList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
