import TopMenu from "@/components/client/TopMenu/TopMenu";
import GrayCard from "@/components/common/GrayCard";
import GrayCardHeader from "@/components/common/GrayCardHeader";
import React from "react";

export const metadata = {
  title: "Компания DAO - красивая мозаика || Доставка", // Title for this page
  description:
    "Поставка мраморной, стеклянной и керамической мозаики из Китая. Складская программа в Москве.",
};

export default function DeliveryPage() {
  return (
    <div className="bg-container">
      <TopMenu page={"delivery"} />
      <div className="content-container">
        <GrayCard className={"graycard-settings"}>
          <GrayCardHeader className="text-[30px] mb-[30px] md:ml-10">
            О доставке
          </GrayCardHeader>

          <GrayCardHeader className="text-[18px]">По Москве:</GrayCardHeader>
          <p className="mb-4">
            Наши курьеры доставляют мозаику по Москве и Подмосковью.
          </p>
          <p>
            Стоимость доставки по Москве - 1000р. Стоимость доставки по
            Подмосковью может меняться от расстояния.
          </p>

          <GrayCardHeader className="text-[18px] mt-[30px]">
            В другие города:
          </GrayCardHeader>
          <p className="mb-4">
            В другие города мы отправляем через транспортные компании (ПЭК,
            Деловые Линии и другие)
          </p>
          <p>Уточните пожалуйста стоимость доставки у наших менеджеров.</p>
        </GrayCard>
      </div>
    </div>
  );
}
