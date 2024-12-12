import Link from "next/link";
import React from "react";
import Image from "next/image";

export default function ImageIcon({
  imageLink,
  targetLink = "",
  width = 100,
  height = 100,
}: {
  imageLink: string;
  targetLink?: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className=" border border-slate-300 rounded-[3px] bg-transparent p-[5px]">
      <Link href={targetLink}>
        <Image src={imageLink} width={width} height={height} alt=""></Image>
      </Link>
    </div>
  );
}
