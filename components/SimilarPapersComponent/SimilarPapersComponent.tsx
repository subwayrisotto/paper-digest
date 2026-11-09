"use client";
import React, { useState } from "react";

function SimilarPapers(props: { paperId: number }) {
  const { paperId } = props;
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function fetchSimilarPapers(id: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/papers/${id}/similar`);
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching similar papers:", error);
    } finally {
      setLoading(false);
    }
    setOpen(true);
  }

  function handleClick() {
    if (open) {
      setOpen(false);
    } else if (results.length > 0) {
      setOpen(true);
    } else {
      fetchSimilarPapers(paperId);
    }
  }

  return (
    <div>
      <div>
        {loading ? (
          <p>Loading similar papers...</p>
        ) : (
          <div>
            {open && results.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mt-4">Similar Papers:</h3>
                <ul className="list-disc list-inside d-flex flex-row">
                  {results.map((paper) => (
                    <li key={paper.id} className="my-1">
                      <strong>{paper.title}</strong> (Similarity:{" "}
                      {Math.round(paper.similarity * 100)}%)
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              className="bg-blue-500 text-white py-2 px-4 rounded mt-4"
              onClick={handleClick}
              disabled={loading}
            >
              {open ? "Hide Similar Papers" : "Show Similar Papers"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimilarPapers;
