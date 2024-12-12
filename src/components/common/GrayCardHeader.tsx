import React from "react";

export default function GrayCardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-[22px] leading-[27px] font-bold mb-[10px] ${className}`}
    >
      {children}
    </h2>
  );
}
