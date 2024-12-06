"use client";
import React, { useState, useRef, useEffect } from "react";
import { logout } from "@/actions/auth";
import TopMenuItem from "./topMenuItem";
import { RxHamburgerMenu } from "react-icons/rx";

export default function Header({ page }: { page?: string }) {
  const [maxHeight, setMaxHeight] = useState<string>("0px");
  const [isMobile, setIsMobile] = useState<boolean>(false); // Track if the view is mobile
  const [isMounted, setIsMounted] = useState(false);

  const ulRef = useRef<HTMLUListElement>(null);

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
          className={`overflow-hidden transition-[max-height] duration-500 ease-in-out md:flex flex-col md:flex-row justify-center md:justify-end items-center gap-2 tracking-wide max-h-0 md:max-h-full`}
          style={{ maxHeight: isMobile && isMounted ? maxHeight : undefined }} // Only apply maxHeight on mobile
        >
          <TopMenuItem
            currentPage={page}
            menuItemTargetPage="main"
            link="/admin"
          >
            Главная
          </TopMenuItem>

          <TopMenuItem
            currentPage={page}
            menuItemTargetPage="user"
            link="/admin/user"
          >
            Пользователь
          </TopMenuItem>
          <li className="text-center pb-2 md:pb-0   hover:text-black transition-colors  hover:underline ">
            <div>
              <form action={logout}>
                <button
                  className={`text-red-800 hover:underline`}
                  type="submit"
                >
                  Выйти
                </button>
              </form>
            </div>
          </li>
        </ul>
      </div>
    </header>
  );
}
