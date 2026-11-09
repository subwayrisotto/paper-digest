"use client";
import { useState } from "react";

function LikeButtons({
  paperId,
  initial,
}: {
  paperId: number;
  initial: boolean | null;
}) {
  const [vote, setVote] = useState<boolean | null>(initial);
  const [error, setError] = useState<string | null>(null);

  async function sendVote(liked: boolean) {
    const previous = vote;
    setError(null);
    setVote(liked);

    try {
      const res = await fetch(`/api/papers/${paperId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked }),
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    } catch (err) {
      console.error("Error sending feedback:", err);
      setVote(previous); // undo the highlight
      setError("Couldn't save your vote. Try again.");
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-label="Like"
        className={`py-2 px-4 rounded mr-2 ${
          vote === true
            ? "bg-green-500 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
        onClick={() => sendVote(true)}
      >
        👍 Like
      </button>
      <button
        type="button"
        aria-label="Dislike"
        className={`py-2 px-4 rounded ${
          vote === false ? "bg-red-500 text-white" : "bg-gray-200 text-gray-700"
        }`}
        onClick={() => sendVote(false)}
      >
        👎 Dislike
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}

export default LikeButtons;
