"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useFormState } from "react-dom";
import { DeleteFormState } from "@/components/common/delete/deleteTypes";
import FormButton from "@/components/common/formButton/formButton";

export function ConfirmDialog({
  id,
  action,
  message,
  confirmLabel,
  confirmColor = "green",
  trigger,
}: {
  id: string;
  action: (
    _formState: DeleteFormState,
    formData: FormData
  ) => Promise<DeleteFormState>;
  message: string;
  confirmLabel: string;
  confirmColor?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [formState, formAction] = useFormState(action, { errors: {} });

  useEffect(() => {
    if (formState.success) {
      setOpen(false);
    }
  }, [formState]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="font-open-sans">
        <DialogTitle>{message}</DialogTitle>
        <DialogDescription></DialogDescription>
        <div className="flex justify-center gap-8 mt-8">
          <form action={formAction}>
            <input type="hidden" name="id" value={id} />
            <FormButton color={confirmColor} small={true}>
              {confirmLabel}
            </FormButton>
            {formState.errors?._form && (
              <div className="error">{formState.errors._form.join(", ")}</div>
            )}
          </form>
          <div
            className="link-button link-button-gray"
            onClick={() => setOpen(false)}
          >
            Отмена
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
