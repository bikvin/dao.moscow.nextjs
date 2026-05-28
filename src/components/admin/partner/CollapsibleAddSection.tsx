"use client";

import { useState, useEffect } from "react";
import { PlusCircle, ChevronUp } from "lucide-react";

export function CollapsibleAddSection({
  label,
  success,
  showLabel,
  defaultOpen,
  children,
}: {
  label: string;
  success?: boolean;
  showLabel?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  useEffect(() => {
    if (success) setOpen(false);
  }, [success]);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          showLabel
            ? open
              ? "mt-4 link-button link-button-gray text-sm"
              : "mt-4 link-button link-button-green text-sm"
            : "mt-4 text-emerald-600 hover:text-emerald-700"
        }
        title={open ? "Свернуть" : label}
      >
        {showLabel ? (
          open ? (
            "Свернуть"
          ) : (
            label
          )
        ) : open ? (
          <ChevronUp className="w-6 h-6 stroke-[2.5]" />
        ) : (
          <PlusCircle className="w-6 h-6 stroke-[2.5]" />
        )}
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
