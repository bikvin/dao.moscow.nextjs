"use client";

import { useTransition } from "react";

export function DeleteItemButton({
  action,
  fields,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="inline">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={isPending}
        className="text-red-500 text-xs hover:underline disabled:opacity-40"
      >
        {isPending ? "..." : "Удалить"}
      </button>
    </form>
  );
}
