import Link from "next/link";
import React from "react";
import Image from "next/image";

export default function ImageIcon({
  imageLink,
  targetLink = "",
  children,
}: {
  imageLink: string;
  targetLink?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className=" border border-slate-300 rounded-[3px] bg-transparent p-[5px]  ">
      <div className="relative aspect-square w-full min-w-[100px]">
        <Link href={targetLink}>
          <Image src={imageLink} fill={true} alt=""></Image>
        </Link>
      </div>

      {children}
    </div>
  );
}
