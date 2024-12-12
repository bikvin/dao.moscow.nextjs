import React from "react";

export default function GrayCardHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 className="text-[22px] leading-[27px] font-bold mb-[10px]">
      {children}
    </h2>
  );
}
