"use client";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

export type DropdownItemLink = {
  type: "link";
  name: string;
  link: string;
  adminOnly?: boolean;
};

export type DropdownItemSub = {
  type: "dropdown";
  name: string;
  adminOnly?: boolean;
  data: DropdownItemLink[];
};

export type DropdownItem = DropdownItemLink | DropdownItemSub;

function allLinks(items: DropdownItem[]): string[] {
  return items.flatMap((item) =>
    item.type === "link" ? [item.link] : item.data.map((d) => d.link)
  );
}

export default function TopMenuDropdown({
  name,
  data,
  isAdmin,
}: {
  name: string;
  data: DropdownItem[];
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const visibleItems = data.filter((item) => !item.adminOnly || isAdmin);
  const isActive = allLinks(visibleItems).includes(pathname);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex items-center mx-auto md:mx-0 pb-2 md:pb-0 outline-none focus:outline-none ring-0 focus:ring-0 hover:underline ${
          isActive ? "underline" : ""
        }`}
      >
        {name}
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {visibleItems.map((item) => {
          if (item.type === "link") {
            return (
              <DropdownMenuItem key={item.name}>
                <Link
                  href={item.link}
                  className={`hover:underline ${pathname === item.link ? "underline" : ""}`}
                >
                  {item.name}
                </Link>
              </DropdownMenuItem>
            );
          }

          const subActive = item.data.some((d) => d.link === pathname);
          return (
            <DropdownMenuSub key={item.name}>
              <DropdownMenuSubTrigger className={subActive ? "underline" : ""}>
                {item.name}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {item.data.map((subItem) => (
                  <DropdownMenuItem key={subItem.name}>
                    <Link
                      href={subItem.link}
                      className={`hover:underline ${pathname === subItem.link ? "underline" : ""}`}
                    >
                      {subItem.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
