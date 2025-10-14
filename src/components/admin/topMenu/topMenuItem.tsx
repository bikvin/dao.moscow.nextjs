"use client";
import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";

export default function TopMenuItem({
  children,
  link,
}: {
  children: React.ReactNode;
  link: string;
}) {
  const pathname = usePathname();
  const isActive = pathname === link;

  return (
    <li
      className={`text-center pb-2 md:pb-0 hover:underline ${
        isActive ? "underline" : ""
      }`}
    >
      <Link href={link}>{children}</Link>
    </li>
  );
}
