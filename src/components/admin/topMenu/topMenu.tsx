"use client";
import React, { useState, useRef, useEffect } from "react";
import TopMenuItem from "./topMenuItem";
import { RxHamburgerMenu } from "react-icons/rx";
import { useUser } from "@/components/providers/UserProviderClient";

import TopMenuDropdown from "./TopMenuDropdown";
import { LogoutForm } from "../LogoutForm/LogoutForm";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, CircleUserRound } from "lucide-react";

type TopMenuItemBase = {
  name: string;
  adminOnly?: boolean;
};

type TopMenuItemLink = TopMenuItemBase & {
  type: "link";
  link: string;
};

type TopMenuDropDown = TopMenuItemBase & {
  type: "dropdown";
  data: TopMenuItemLink[];
};

// change menu items here
type TopMenuItem = TopMenuItemLink | TopMenuDropDown;
const topMenuList: TopMenuItem[] = [
  {
    type: "link",
    name: "Главная",
    link: "/admin",
  },

  {
    name: "Товары",
    type: "dropdown",
    adminOnly: true,
    data: [
      {
        type: "link",
        name: "Все товары",
        link: "/admin/products",
      },
      {
        type: "link",
        name: "Создать товар",
        link: "/admin/products/create",
      },
      {
        type: "link",
        name: "Группы товаров",
        link: "/admin/products/product-groups",
      },
      {
        type: "link",
        name: "Создать группу",
        link: "/admin/products/product-groups/create",
      },
    ],
  },

  {
    name: "Пользователи",
    type: "dropdown",
    adminOnly: true,
    data: [
      {
        type: "link",
        name: "Все пользователи",
        link: "/admin/users/all-users",
      },
      {
        type: "link",
        name: "Создать пользователя",
        link: "/admin/users/create",
      },
    ],
  },
];

export function TopMenu() {
  const [maxHeight, setMaxHeight] = useState<string>("0px");
  const [isMobile, setIsMobile] = useState<boolean>(false); // Track if the view is mobile
  const [isMounted, setIsMounted] = useState(false);

  const ulRef = useRef<HTMLUListElement>(null);

  const pathname = usePathname();

  const { name, isAdmin } = useUser();

  useEffect(() => {
    setIsMounted(true);

    // Check the window size on the client-side only
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();

    // Add event listener to track window resizing
    window.addEventListener("resize", handleResize);

    // Cleanup the event listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const clickHandler = () => {
    if (ulRef.current) {
      // If the menu is closed, set max-height to the full scrollHeight
      if (maxHeight === "0px") {
        setMaxHeight(`${ulRef.current.scrollHeight}px`);
      } else {
        // Collapse the menu
        setMaxHeight("0px");
      }
    }
  };

  const userItemActive = pathname === "/admin/profile";

  return (
    <header className="bg-green8  px-8">
      <div className="flex flex-col md:flex-row justify-between max-w-screen-lg mx-auto">
        <h3 className="font-bitter md:text-lg font-bold tracking-widest my-4">
          Админка
        </h3>
        <RxHamburgerMenu
          onClick={clickHandler}
          className="absolute top-4 right-4 w-8 h-8 md:hidden"
        />
        <ul
          ref={ulRef}
          className={`overflow-hidden transition-[max-height] duration-500 ease-in-out md:flex flex-col md:flex-row justify-center md:justify-end items-center gap-4 tracking-wide max-h-0 md:max-h-full`}
          style={{ maxHeight: isMobile && isMounted ? maxHeight : undefined }} // Only apply maxHeight on mobile
        >
          {topMenuList
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              if (item.type === "link") {
                return (
                  <TopMenuItem key={item.name} link={item.link}>
                    {item.name}
                  </TopMenuItem>
                );
              } else if (item.type === "dropdown") {
                return (
                  <TopMenuDropdown
                    key={item.name}
                    name={item.name}
                    data={item.data}
                  />
                );
              }
            })}
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`flex items-center  mx-auto md:mx-0 pb-2 md:pb-0 outline-none focus:outline-none ring-0 focus:ring-0 hover:underline ${
                  userItemActive ? "underline" : ""
                }`}
              >
                <CircleUserRound className="mr-1" />
                {name}
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="text-lg">
                <DropdownMenuItem>
                  <Link
                    href={"/admin/profile"}
                    className={`hover:underline ${
                      pathname === "/admin/profile" ? "underline" : ""
                    }`}
                  >
                    Профиль
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="">
                    <LogoutForm />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </div>
    </header>
  );
}
