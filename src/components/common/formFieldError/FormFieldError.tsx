interface FormFieldErrorProps {
  errors?: string[];
}

export function FormFieldError({ errors }: FormFieldErrorProps) {
  if (!errors || errors.length === 0) return null;

  return <div className="error">{errors.join(", ")}</div>;
}
