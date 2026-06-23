"use client";
import React, { useState, useRef, useEffect } from "react";
import TopMenuItem from "./topMenuItem";
import { RxHamburgerMenu } from "react-icons/rx";
import { useUser } from "@/components/providers/UserProviderClient";

import TopMenuDropdown, { type DropdownItem } from "./TopMenuDropdown";
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
  data: DropdownItem[];
};

// change menu items here
type TopMenuItem = TopMenuItemLink | TopMenuDropDown;
const topMenuList: TopMenuItem[] = [
  {
    name: "Продажи",
    type: "dropdown",
    data: [
      { type: "link", name: "Заказы", link: "/admin" },
      { type: "link", name: "Счета и накладные", link: "/admin/invoices" },
      {
        type: "dropdown",
        name: "Товары",
        data: [
          { type: "link", name: "Товары",          link: "/admin/products" },
          { type: "link", name: "Группы товаров",  link: "/admin/products/product-groups" },
          { type: "link", name: "Приходы",         link: "/admin/products/product-receipts" },
          { type: "link", name: "Цены закупки",    link: "/admin/products/receipt-prices" },
          { type: "link", name: "Списания",        link: "/admin/products/product-issues" },
          { type: "link", name: "Резервы",         link: "/admin/products/product-reserves" },
          { type: "link", name: "Размеры чипа",    link: "/admin/products/chip-sizes" },
          { type: "link", name: "Импорт цен",      link: "/admin/import" },
        ],
      },
      {
        type: "dropdown",
        name: "Партнёры",
        data: [
          { type: "link", name: "Все партнёры",            link: "/admin/partners" },
          { type: "link", name: "Добавить партнёра",       link: "/admin/partners/create" },
          { type: "link", name: "Города",                  link: "/admin/partners/cities" },
          { type: "link", name: "Транспортные компании",   link: "/admin/partners/transport-companies" },
          { type: "link", name: "Типы образцов",           link: "/admin/partners/sample-types" },
          { type: "link", name: "Типы партнёров",          link: "/admin/partners/partner-types" },
          { type: "link", name: "Торговые центры",         link: "/admin/partners/shopping-malls" },
        ],
      },
    ],
  },

  {
    type: "link",
    name: "Склад",
    link: "/admin/warehouse",
  },

  {
    type: "link",
    name: "Прайс-лист",
    link: "/admin/prices",
  },

  {
    name: "Настройки",
    type: "dropdown",
    data: [
      {
        type: "dropdown",
        name: "Курс валют",
        data: [
          { type: "link", name: "Курс валют", link: "/admin/exchange-rate" },
          { type: "link", name: "Настройки",  link: "/admin/exchange-rate/settings" },
        ],
      },
      {
        type: "dropdown",
        name: "Пользователи",
        adminOnly: true,
        data: [
          { type: "link", name: "Все пользователи",     link: "/admin/users/all-users" },
          { type: "link", name: "Создать пользователя", link: "/admin/users/create" },
        ],
      },
      {
        type: "link",
        name: "Способы доставки",
        link: "/admin/orders/delivery-methods",
      },
      {
        type: "link",
        name: "Способы оплаты",
        link: "/admin/orders/payment-methods",
      },
      {
        type: "link",
        name: "Реквизиты продавца",
        link: "/admin/invoices/settings",
      },
    ],
  },

  {
    name: "Маркетплейсы",
    type: "dropdown",
    adminOnly: true,
    data: [
      {
        type: "dropdown",
        name: "Яндекс",
        data: [
          { type: "link", name: "Настройки",                link: "/admin/yandex" },
          { type: "link", name: "Синхронизации остатков",   link: "/admin/yandex/sync-history" },
          { type: "link", name: "Синхронизации цен",        link: "/admin/yandex/price-sync-history" },
          { type: "link", name: "Маппинг товаров",          link: "/admin/yandex/mappings" },
        ],
      },
      {
        type: "dropdown",
        name: "Ozon",
        data: [
          { type: "link", name: "Настройки",                link: "/admin/ozon" },
          { type: "link", name: "Синхронизации остатков",   link: "/admin/ozon/sync-history" },
          { type: "link", name: "Синхронизации цен",        link: "/admin/ozon/price-sync-history" },
          { type: "link", name: "Маппинг товаров",          link: "/admin/ozon/mappings" },
        ],
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
          <Link href="/admin">Админка</Link>
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
                    isAdmin={isAdmin}
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
