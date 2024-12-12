import React from "react";

export default function GrayCard({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={` bg-gray2 py-[25px] px-[20px]  rounded-[5px] ${className}`}
    >
      {children}
    </div>
  );
}
