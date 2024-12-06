import Link from "next/link";
import React from "react";

export default function TopMenuItem({
  children,
  currentPage,
  menuItemTargetPage,
  link,
}: {
  children: React.ReactNode;
  currentPage?: string;
  menuItemTargetPage: string;
  link: string;
}) {
  return (
    <li
      className={`text-center pb-2 md:pb-0 hover:underline ${
        currentPage === menuItemTargetPage ? "underline" : ""
      }`}
    >
      <Link href={link}>{children}</Link>
    </li>
  );
}
