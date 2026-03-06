import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function pageUrl(page: number) {
    const params = new URLSearchParams();
    if (searchParams) {
      for (const [key, value] of Object.entries(searchParams)) {
        if (value && key !== "page") params.set(key, value);
      }
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-8 mb-16">
      {currentPage > 1 ? (
        <Link
          href={pageUrl(currentPage - 1)}
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
          href={pageUrl(currentPage + 1)}
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
