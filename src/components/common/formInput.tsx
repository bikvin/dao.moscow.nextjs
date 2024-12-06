import React from "react";

export default function FormInput({
  children,
  name,
  defaultValue,
  formState,
}: {
  children: React.ReactNode;
  name: string;
  defaultValue?: string;
  formState: any;
}) {
  return (
    <div>
      <label htmlFor={name}>{children}</label>

      <input name={name} type="text" defaultValue={defaultValue}></input>
      {formState.errors && (
        <div className="error">{formState.errors[name]?.join(", ")}</div>
      )}
    </div>
  );
}
