"use client";

import { useRouter } from "next/navigation";
import { CurrencyEnum } from "@prisma/client";

// Year filter for the cash page.
export function CashFilters({
  selectedCurrency,
  selectedYear,
  yearRange,
}: {
  selectedCurrency: CurrencyEnum;
  selectedYear: number;
  yearRange: number[];
}) {
  const router = useRouter();

  function navigate(year: number) {
    const params = new URLSearchParams();
    params.set("currency", selectedCurrency);
    params.set("year", String(year));
    router.push(`/admin/cash?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <select
        value={selectedYear}
        onChange={(e) => navigate(parseInt(e.target.value, 10))}
        className="admin-form-input text-sm w-28"
      >
        {yearRange.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}
