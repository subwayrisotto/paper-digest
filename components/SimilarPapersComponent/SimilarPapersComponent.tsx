"use client";
import React, { useState, useEffect } from "react";

function SimilarPapers(props: { paperId: number }) {
  const { paperId } = props;
  const [results, setResults] = useState<any[]>([]);

  async function fetchSimilarPapers(id: number) {
    try {
      const res = await fetch(`/api/papers/${id}/similar`);
      const data = await res.json();
      setResults(data);
      console.log(results);
    } catch (error) {
      console.error("Error fetching similar papers:", error);
    }
  }

  return (
    <div>
      {results.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold mt-4">Similar Papers:</h3>
          <ul className="list-disc list-inside">
            {results.map((paper) => (
              <li key={paper.id}>
                <strong>{paper.title}</strong> (Similarity:{" "}
                {paper.similarity.toFixed(2)})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          className="bg-blue-500 text-white py-2 px-4 rounded"
          onClick={() => fetchSimilarPapers(paperId)}
        >
          Similar Papers
        </button>
      )}
    </div>
  );
}

export default SimilarPapers;
