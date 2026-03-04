import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-8 mb-16">
      {currentPage > 1 ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-3 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
        >
          ←
        </Link>
      ) : (
        <span className="px-3 py-1 rounded border border-slate-200 text-slate-300">
          ←
        </span>
      )}

      <span className="text-sm text-slate-500">
        {currentPage} / {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-3 py-1 rounded border border-slate-300 text-slate-600 hover:bg-slate-100"
        >
          →
        </Link>
      ) : (
        <span className="px-3 py-1 rounded border border-slate-200 text-slate-300">
          →
        </span>
      )}
    </div>
  );
}
