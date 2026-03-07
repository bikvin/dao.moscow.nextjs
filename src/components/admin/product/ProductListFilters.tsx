"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export type FilterState = {
  sku: string;
  dateFrom: string;
  dateTo: string;
  type: string;
};

export function ProductListFilters({
  current,
  typeOptions,
  allTypeValue = "",
}: {
  current: FilterState;
  typeOptions: { value: string; label: string }[];
  allTypeValue?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [skuInput, setSkuInput] = useState(current.sku);
  const currentRef = useRef(current);

  useEffect(() => {
    currentRef.current = current;
  });

  // Sync sku input on browser back/forward
  useEffect(() => {
    setSkuInput(current.sku);
  }, [current.sku]);

  const push = useCallback(
    (f: FilterState) => {
      const params = new URLSearchParams();
      if (f.sku) params.set("sku", f.sku);
      if (f.dateFrom) params.set("dateFrom", f.dateFrom);
      if (f.dateTo) params.set("dateTo", f.dateTo);
      if (f.type) params.set("type", f.type);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router],
  );

  // Debounce sku changes
  useEffect(() => {
    if (skuInput === currentRef.current.sku) return;
    const timer = setTimeout(() => {
      push({ ...currentRef.current, sku: skuInput });
    }, 400);
    return () => clearTimeout(timer);
  }, [skuInput, push]);

  function update(patch: Partial<FilterState>) {
    push({ ...currentRef.current, sku: skuInput, ...patch });
  }

  function reset() {
    setSkuInput("");
    push({ sku: "", dateFrom: "", dateTo: "", type: "" });
  }

  const inputClass =
    "border border-slate-300 rounded-md py-1 px-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-0";

  return (
    <div className="flex flex-wrap gap-2 mb-6 items-center">
      <input
        type="text"
        placeholder="Поиск по SKU..."
        value={skuInput}
        onChange={(e) => setSkuInput(e.target.value)}
        className={`${inputClass} w-36`}
      />
      <input
        type="date"
        value={current.dateFrom}
        onChange={(e) => update({ dateFrom: e.target.value })}
        className={inputClass}
        title="С"
      />
      <span className="text-slate-400 text-sm">—</span>
      <input
        type="date"
        value={current.dateTo}
        onChange={(e) => update({ dateTo: e.target.value })}
        className={inputClass}
        title="По"
      />
      {typeOptions.length > 0 && (
        <select
          value={current.type}
          onChange={(e) => update({ type: e.target.value })}
          className={inputClass}
        >
          <option value={allTypeValue}>Все типы</option>
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      <button
        onClick={reset}
        className="text-sm text-slate-400 hover:text-slate-600 underline"
      >
        Сбросить
      </button>
    </div>
  );
}
