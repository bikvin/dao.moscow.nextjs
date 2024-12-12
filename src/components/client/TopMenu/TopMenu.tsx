"use client";

import React, { useState, useRef, useEffect } from "react";

import { RxHamburgerMenu } from "react-icons/rx";
import MenuItem from "./MenuItem";

export default function TopMenu() {
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
    <header className="relative  px-8 bg-gradient-to-b from-blackish1 to-blackish2 text-white shadow-[0_1px_3px_rgba(0,0,0,0.25),_inset_0_-1px_0_rgba(0,0,0,0.1)] text-[13px]">
      <div className="relative z-[2] flex flex-col md:flex-row justify-between items-center max-w-screen-lg mx-auto min-h-12 md:min-h-0">
        <RxHamburgerMenu
          onClick={clickHandler}
          className="absolute top-2 right-4 w-8 h-8 md:hidden"
        />
        <ul
          ref={ulRef}
          className={`overflow-hidden transition-[max-height] duration-500 ease-in-out md:flex flex-col md:flex-row justify-center md:justify-between items-center gap-0 tracking-wide max-h-0 md:max-h-full mt-12 md:mt-0 w-full`}
          style={{ maxHeight: isMobile && isMounted ? maxHeight : undefined }} // Only apply maxHeight on mobile
        >
          <div className={"flex flex-col md:flex-row"}>
            <MenuItem>Главная</MenuItem>
            <MenuItem>Продукция</MenuItem>
            <MenuItem>Партнерам</MenuItem>
            <MenuItem>Контакты</MenuItem>
            <MenuItem>Доставка</MenuItem>
          </div>
          <div
            className={
              "flex flex-col gap-2 md:flex-row items-center pb-2 md:pb-0"
            }
          >
            <div className="text-[15px]">+7-985-513-27-44</div>
            <div className="text-[15px]">+7-903-589-22-17</div>
          </div>
        </ul>
      </div>
    </header>
  );
}
