import Link from "next/link";
import React, { CSSProperties } from "react";

export default function LinkButton({
  children,
  href,
  sizeRatio = 1,
  className,
}: {
  children: React.ReactNode;
  href: string;
  sizeRatio?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`bg-slate-700 text-slate-300 rounded-full text-[calc(1.2em*var(--size-ratio))] px-[calc(20px*var(--size-ratio))] py-[calc(10px*var(--size-ratio))] hover:bg-slate-500  transition-colors duration-500 ease-in-out text-center ${className}`}
      style={{ "--size-ratio": sizeRatio } as CSSProperties}
    >
      {children}
    </Link>
  );
}
