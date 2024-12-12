import Link from "next/link";
import React from "react";

export default function MenuItem({
  children,
  currentPage,
  menuItemPage,
  href,
}: {
  children: React.ReactNode;
  currentPage: string;
  menuItemPage: string;
  href: string;
}) {
  return (
    <li
      className={`text-center pb-2 md:pt-[9px] md:pb-[11px] md:px-[10px]   hover:text-white transition-colors ease-in delay-100 text-[13px] md:text-gray1 ${
        currentPage === menuItemPage ? "bg-black text-white md:text-white" : ""
      }`}
    >
      <Link href={href}>{children}</Link>
    </li>
  );
}
