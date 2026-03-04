import React from "react";

export function ProductDateGroupedList<T extends { id: string }>({
  items,
  getDate,
  emptyMessage,
  renderItem,
}: {
  items: T[];
  getDate: (item: T) => Date;
  emptyMessage: string;
  renderItem: (item: T) => React.ReactNode;
}) {
  const grouped = items.reduce(
    (acc, item) => {
      const d = new Date(getDate(item));
      d.setHours(12, 0, 0, 0);
      const date = d.toISOString().slice(0, 10);
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );

  return (
    <>
      {items.length === 0 && (
        <div className="text-center text-xl mt-10 font-light tracking-widest">
          {emptyMessage}
        </div>
      )}

      <div className="mt-10">
        {Object.entries(grouped).map(([date, groupItems]) => (
          <div key={date} className="mb-8">
            {new Date(date).toLocaleDateString("ru-RU")}
            {groupItems.map((item) => renderItem(item))}
          </div>
        ))}
      </div>
    </>
  );
}
