import Link from "next/link";

function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const linkClass = "px-3 py-1 rounded border text-blue-600 hover:bg-gray-100";
  const disabledClass = "px-3 py-1 rounded border text-gray-400";

  return (
    <nav
      aria-label="Pagination"
      className="flex justify-between items-center my-3"
    >
      {hasPrev ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className={linkClass}
        >
          ← Previous
        </Link>
      ) : (
        <span className={disabledClass}>← Previous</span>
      )}

      <span className="text-sm text-gray-600">
        Page {currentPage} of {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className={linkClass}
        >
          Next →
        </Link>
      ) : (
        <span className={disabledClass}>Next →</span>
      )}
    </nav>
  );
}

export default Pagination;
