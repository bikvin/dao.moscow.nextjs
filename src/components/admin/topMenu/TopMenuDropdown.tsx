"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

export default function TopMenuDropdown({
  name,
  data,
}: {
  name: string;
  data: { name: string; link: string }[];
}) {
  const pathname = usePathname();
  const isActive = data.some((item) => item.link === pathname);

  return (
    <DropdownMenu key={name}>
      <DropdownMenuTrigger
        className={`flex items-center mx-auto md:mx-0 pb-2 md:pb-0 outline-none focus:outline-none ring-0 focus:ring-0 hover:underline ${
          isActive ? "underline" : ""
        }`}
      >
        {name}
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {data &&
          data.map((dropDownItem) => {
            const isChildActive = pathname === dropDownItem.link;

            return (
              <DropdownMenuItem key={dropDownItem.name}>
                <Link
                  href={dropDownItem.link}
                  className={`hover:underline ${
                    isChildActive ? "underline" : ""
                  }`}
                >
                  {dropDownItem.name}
                </Link>
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
