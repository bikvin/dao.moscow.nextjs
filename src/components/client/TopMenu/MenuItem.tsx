import Link from "next/link";
import React from "react";

export default function MenuItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-center pb-2 md:pt-[9px] md:pb-[11px] md:px-[10px]   hover:text-white transition-colors ease-in delay-100 text-[13px] md:text-gray1 ">
      <Link href="/#whatIdo">{children}</Link>
    </li>
  );
}
