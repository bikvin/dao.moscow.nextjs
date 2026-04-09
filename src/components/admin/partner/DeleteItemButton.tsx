"use client";

import { useTransition, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RxCross2 } from "react-icons/rx";

export function DeleteItemButton({
  action,
  fields,
  message = "Вы уверены, что хотите удалить?",
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  message?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    const formData = new FormData();
    for (const [name, value] of Object.entries(fields)) {
      formData.append(name, value);
    }
    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {label ? (
          <button className="link-button link-button-red text-sm">{label}</button>
        ) : (
          <button className="text-slate-300 hover:text-red-500 transition-colors">
            <RxCross2 className="w-4 h-4" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="font-open-sans">
        <DialogTitle>{message}</DialogTitle>
        <DialogDescription></DialogDescription>
        <div className="flex justify-center gap-8 mt-8">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="link-button link-button-red"
          >
            {isPending ? "..." : "Удалить"}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="link-button link-button-gray"
          >
            Отмена
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
