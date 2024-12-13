import React from "react";
import TopMenu from "@/components/client/TopMenu/TopMenu";
import GrayCard from "@/components/common/GrayCard";
import GrayCardHeader from "@/components/common/GrayCardHeader";
import ImageIcon from "@/components/common/ImageIcon";

export default function SkladPage() {
  const goods = [
    { name: "DAO-502-15-4", priceUSD: 109 },
    { name: "DAO-502-23-4", priceUSD: 116 },
    { name: "DAO-602-15-4", priceUSD: 116 },
    { name: "DAO-602-23-4", priceUSD: 119 },
    { name: "DAO-503-15-4", priceUSD: 85 },
    { name: "DAO-503-23-4", priceUSD: 85 },
    { name: "DAO-603-23-4", priceUSD: 94 },
    { name: "DAO-604-15-4", priceUSD: 86 },
    { name: "DAO-604-23-4", priceUSD: 94 },
    { name: "DAO-505-15-4", priceUSD: 89 },
    { name: "DAO-505-23-4", priceUSD: 89 },
    { name: "DAO-605-15-4", priceUSD: 92 },
    { name: "DAO-605-23-4", priceUSD: 101 },
    { name: "DAO-505-23-8", priceUSD: 94 },
    { name: "DAO-605-23-8", priceUSD: 112 },
    { name: "DAO-605-48-8", priceUSD: 118 },
    { name: "DAO-606-15-4", priceUSD: 86 },
    { name: "DAO-606-23-4", priceUSD: 93 },
    { name: "DAO-606-48-8", priceUSD: 95 },
    { name: "DAO-607-23-4", priceUSD: 95 },
    { name: "DAO-608-15-4", priceUSD: 81 },
    { name: "DAO-608-23-4", priceUSD: 85 },
    { name: "DAO-609-23-4", priceUSD: 106 },
    { name: "DAO-614-23-4", priceUSD: 102 },
    { name: "DAO-614-T", priceUSD: 98 },
    { name: "DAO-615-23-8", priceUSD: 108 },
    { name: "DAO-516-23-4", priceUSD: 94 },
    { name: "DAO-531-15-4", priceUSD: 90 },
    { name: "DAO-531-23-4", priceUSD: 106 },
    { name: "DAO-631-23-4", priceUSD: 101 },
    { name: "DAO-531-23-8", priceUSD: 112 },
    { name: "DAO-631-23-8", priceUSD: 112 },
    { name: "DAO-532-15-4", priceUSD: 76 },
    { name: "DAO-532-23-4", priceUSD: 86 },
    { name: "DAO-532-15-8", priceUSD: 101 },
    { name: "DAO-532-23-8", priceUSD: 107 },
    { name: "DAO-533-15-4", priceUSD: 88 },
    { name: "DAO-533-23-4", priceUSD: 96 },
    { name: "DAO-633-15-4", priceUSD: 99 },
    { name: "DAO-633-23-4", priceUSD: 112 },
    { name: "DAO-533-15-8", priceUSD: 103 },
    { name: "DAO-533-23-8", priceUSD: 106 },
    { name: "DAO-533-23-48-4", priceUSD: 103 },
    { name: "DAO-633-15-8", priceUSD: 110 },
    { name: "DAO-633-23-8", priceUSD: 112 },
    { name: "DAO-633-48-8", priceUSD: 123 },
    { name: "DAO-634-23-4", priceUSD: 90 },
    { name: "DAO-634-23-148-8", priceUSD: 121 },
    { name: "DAO-635-23-4", priceUSD: 99 },
    { name: "DAO-536-15-4", priceUSD: 91 },
    { name: "DAO-536-23-4", priceUSD: 95 },
    { name: "DAO-636-15-4", priceUSD: 88 },
    { name: "DAO-636-23-4", priceUSD: 101 },
    { name: "DAO-536-15-8", priceUSD: 118 },
    { name: "DAO-536-23-8", priceUSD: 122 },
    { name: "DAO-636-15-8", priceUSD: 106 },
    { name: "DAO-636-23-8", priceUSD: 121 },
    { name: "DAO-636-48-8", priceUSD: 124 },
    { name: "DAO-636-23-148-8", priceUSD: 138 },
    { name: "DAO-636-23-48-4", priceUSD: 97 },
    { name: "DAO-537-15-4", priceUSD: 86 },
    { name: "DAO-537-23-4", priceUSD: 95 },
    { name: "DAO-637-15-4", priceUSD: 91 },
    { name: "DAO-637-23-4", priceUSD: 96 },
    { name: "DAO-538-15-4", priceUSD: 86 },
    { name: "DAO-538-23-4", priceUSD: 89 },
    { name: "DAO-638-15-4", priceUSD: 89 },
    { name: "DAO-638-23-4", priceUSD: 92 },
    { name: "DAO-638-48-8", priceUSD: 129 },
    { name: "DAO-539-15-4", priceUSD: 83 },
    { name: "DAO-539-23-4", priceUSD: 88 },
    { name: "DAO-639-15-4", priceUSD: 84 },
    { name: "DAO-639-23-4", priceUSD: 94 },
    { name: "DAO-539-23-8", priceUSD: 96 },
    { name: "DAO-639-23-8", priceUSD: 106 },
    { name: "DAO-03", priceUSD: 116 },
    { name: "DAO-04", priceUSD: 122 },
    { name: "DAO-39", priceUSD: 119 },
    { name: "DAO-41", priceUSD: 125 },
    { name: "DAO-80", priceUSD: 119 },
    { name: "DAO-82", priceUSD: 125 },
    { name: "DAO-101-23-4", priceUSD: 40 },
    { name: "DAO-103-23-4", priceUSD: 36 },
    { name: "DAO-104-23-4", priceUSD: 36 },
    { name: "DAO-105-48-4", priceUSD: 36 },
    { name: "DAO-106-23-4", priceUSD: 36 },
    { name: "DAO-107-23-4", priceUSD: 36 },
    { name: "DAO-108-23-4", priceUSD: 36 },
    { name: "DAO-109-23-4", priceUSD: 36 },
    { name: "DAO-201-20-4", priceUSD: 36 },
    { name: "DAO-202-20-4", priceUSD: 36 },
    { name: "DAO-203-20-4", priceUSD: 36 },
    { name: "DAO-204-20-4", priceUSD: 36 },
    { name: "DAO-205-20-4", priceUSD: 36 },
    { name: "DAO-05", priceUSD: 186 },
    { name: "DAO-08", priceUSD: 119 },
    { name: "DAO-17", priceUSD: 169 },
    { name: "DAO-18", priceUSD: 151 },
    { name: "DAO-20", priceUSD: 132 },
    { name: "DAO-23", priceUSD: 127 },
    { name: "DAO-25", priceUSD: 134 },
    { name: "DAO-26", priceUSD: 134 },
    { name: "DAO-34", priceUSD: 183 },
    { name: "DAO-42", priceUSD: 123 },
    { name: "DAO-44", priceUSD: 127 },
    { name: "DAO-52", priceUSD: 121 },
    { name: "DAO-54", priceUSD: 146 },
    { name: "DAO-55", priceUSD: 119 },
    { name: "DAO-66", priceUSD: 134 },
    { name: "DAO-69", priceUSD: 99 },
    { name: "DAO-97", priceUSD: 150 },
  ];

  const exchangeRate = 105;

  return (
    <div className="bg-container">
      <TopMenu page={"sklad"} />
      <div className="px-8 flex justify-center  pb-[100px]">
        <GrayCard
          className={"mt-[100px] w-2/3 px-[50px] pt-[100px] pb-[100px]"}
        >
          <GrayCardHeader className="text-[30px] mb-[30px] ml-10">
            Коллекция мозаики на складе
          </GrayCardHeader>
          <div className="grid grid-cold-1 md:grid-cols-3 gap-4 ">
            {goods.map((good) => {
              return (
                <ImageIcon
                  imageLink={`/img/mosaic/thumbs/${good.name}.jpg`}
                  targetLink={`/img/mosaic/${good.name}.jpg`}
                >
                  <GrayCardHeader className="!text-[16px]">
                    {good.name}
                  </GrayCardHeader>
                  <p>Розничная цена: {good.priceUSD * exchangeRate} р. за м2</p>
                </ImageIcon>
              );
            })}
          </div>
        </GrayCard>
      </div>
    </div>
  );
}
