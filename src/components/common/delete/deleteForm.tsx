"use client";
import { useFormState } from "react-dom";
import FormButton from "@/components/common/formButton";
import { DeleteFormState } from "./deleteTypes";
import { useEffect } from "react";

export default function DeleteForm({
  id,
  receivedAction,
  onSuccess,
}: {
  id: string;
  receivedAction: (
    formState: DeleteFormState,
    formData: FormData
  ) => Promise<DeleteFormState>;
  onSuccess: () => void;
}) {
  const [formState = { errors: {} }, action] = useFormState(receivedAction, {
    errors: {},
  });

  useEffect(() => {
    if (formState.success) {
      onSuccess();
    }
  }, [formState, onSuccess]);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <FormButton color={"red"} small={true}>
        Удалить
      </FormButton>

      {formState.errors && (
        <div className="error">{formState.errors?._form?.join(", ")}</div>
      )}
    </form>
  );
}
