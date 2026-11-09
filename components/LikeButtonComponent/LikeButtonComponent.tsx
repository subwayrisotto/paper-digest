"use client";
import { useState } from "react";

function LikeButton({
  paperId,
  initialLiked,
  initialCount,
}: {
  paperId: number;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (pending) return;

    const prevLiked = liked;
    const prevCount = count;

    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/papers/${paperId}/like`, {
        method: liked ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      setCount(data.count);
    } catch (err) {
      console.error("Error toggling like:", err);
      setLiked(prevLiked);
      setCount(prevCount);
      setError("Couldn't save your like. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        className={`cursor-pointer py-1`}
      >
        {liked ? "❤️" : "🤍"} {count}
      </button>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}

export default LikeButton;
