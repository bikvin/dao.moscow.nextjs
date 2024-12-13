import TopMenu from "@/components/client/TopMenu/TopMenu";
import GrayCard from "@/components/common/GrayCard";
import GrayCardHeader from "@/components/common/GrayCardHeader";
import React from "react";
import Image from "next/image";

export default function ContactsPage() {
  return (
    <div className="bg-container">
      <TopMenu page={"contacts"} />
      <div className="content-container">
        <GrayCard className={"graycard-settings"}>
          <GrayCardHeader className="text-[30px] mb-[30px] md:ml-10">
            Контактная информация
          </GrayCardHeader>

          <GrayCardHeader className="text-[18px]">Телефоны:</GrayCardHeader>
          <p>+7-985-513-27-44</p>
          <p>+7-903-589-22-17</p>

          <GrayCardHeader className="text-[18px] mt-[30px]">
            Электронная почта:
          </GrayCardHeader>
          <p>stone.dao@gmail.com</p>

          <GrayCardHeader className="text-[18px] mt-[30px]">
            Склад:
          </GrayCardHeader>
          <p>ул. Крылатские холмы 7/2</p>
          <div className="w-full mt-[10px] mb-[30px]">
            <img src="/img/krylatskie.png" alt="Схема проезда на склад"></img>
          </div>
          <p className="mb-[30px]">
            Ориентир – ресторан ДЖОНДЖОЛИ. Справа от него небольшая парковка и
            магазин «ПАРКЕТ». Отдел мозаики в магазине «Паркет».
          </p>
          <p>
            При возникновении любых вопросов звоните нам по телефонам
            +7-985-513-27-44 или +7-903-589-22-17.
          </p>
        </GrayCard>
      </div>
    </div>
  );
}
