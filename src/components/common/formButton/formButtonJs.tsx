"use client";

interface FormButtonProps {
  children: React.ReactNode;
  color?: string;
  pending?: boolean;
  message?: { text: string; type: "success" | "error" } | null;
  small?: boolean;
}

// This is the button used for submissions via js without actual form submission

export default function FormButtonJs({
  children,
  color = "blue",
  pending = false,
  message,
  small = false,
}: FormButtonProps) {
  const disabledClass = pending ? "bg-slate-300 hover:bg-slate-300" : "";

  let colorClass;
  switch (color) {
    case "blue": {
      colorClass = "bg-blue-500 hover:bg-blue-600";
      break;
    }
    case "green": {
      colorClass = "bg-green-500 hover:bg-green-600";
      break;
    }
    case "red": {
      colorClass = "bg-red-500 hover:bg-red-600";
      break;
    }
  }

  const sizeClass = small
    ? "p-[5px] w-[150px] text-base"
    : "w-full p-[10px] md:p-[30px]";

  return (
    <div className="">
      <button
        className={`border-0 rounded-md  text-white cursor-pointer text-center block  ${colorClass} ${disabledClass} ${sizeClass}`}
        type="submit"
        disabled={pending}
      >
        {pending ? "Загружаем..." : children}
      </button>
      <div
        className={`${
          message?.type === "success" ? "text-emerald-600" : "error"
        } text-center`}
      >
        {message?.text}
      </div>
    </div>
  );
}
