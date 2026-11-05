import PaperList from "@/components/PaperListComponent/PaperListComponents";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1>Paper Digest</h1>
      <Suspense fallback={<p>Loading papers...</p>}>
        <PaperList />
      </Suspense>
    </main>
  );
}
