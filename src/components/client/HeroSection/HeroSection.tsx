import React from "react";
import Image from "next/image";
import SlideShow from "./SlideShow";
import GrayCard from "@/components/common/grayCard";

export default function HeroSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-8 mt-[50px]">
      <div className="col-span-1 flex justify-center items-center">
        <GrayCard>
          <Image
            src="/img/logo.png"
            alt="DAO мозаика лого"
            width={310}
            height={73}
          />
        </GrayCard>
      </div>

      <div className="col-span-1 md:col-span-2 flex justify-center items-center">
        <SlideShow />
      </div>
    </div>
  );
}
