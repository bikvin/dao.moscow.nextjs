import TopMenu from "@/components/client/TopMenu/TopMenu";
import GrayCard from "@/components/common/GrayCard";
import GrayCardHeader from "@/components/common/GrayCardHeader";
import React from "react";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Компания DAO - красивая мозаика || Партнерам",
  description:
    "Поставка мраморной, стеклянной и керамической мозаики из Китая. Складская программа в Москве.",
};

export default function PartnersPage() {
  return (
    <div className="bg-container">
      <TopMenu page={"partners"} />
      <div className="content-container">
        <GrayCard className={"graycard-settings"}>
          <GrayCardHeader className="text-[30px] mb-[30px] ml-5 md:ml-10">
            Партнерам
          </GrayCardHeader>
          <p className="mb-4">
            Приглашаем к сотрудничеству магазины и торговые точки, продающие
            мозаику или желающие начать торговлю этим товаром.
          </p>
          <p>
            Благодаря прямой закупке в Китае мы можем предложить очень
            привлекательные цены. Убедитесь сами!
          </p>
          <GrayCardHeader className="text-[20px]  ml-5 md:ml-10 mt-10 ">
            Как происходит сотрудничество?
          </GrayCardHeader>
          <ol className="list-decimal  ml-5 md:ml-10 mb-10">
            <li>
              Мы предоставляем Вам образцы мозаики для выставления в торговом
              зале.
            </li>
            <li>Покупатель выбирает понравившуюся ему мозаику.</li>
            <li>
              Мы подтверждаем Вам по телефону наличие выбранного наименования на
              складе.
            </li>
            <li>
              Покупатель оставляем Вам предоплату, и Вы отправляете нам заявку
              на покупку мозаики.
            </li>
            <li>
              Вы можете забрать товар на нашем складе и передать его покупателю.
              Либо мы можем осуществить доставку своими силами.
            </li>
            <li>Производится окончательный расчет.</li>
          </ol>
          <p>
            При необходимости, для более наглядного представления мозаики в
            Вашей торговой точке, мы можем предоставить стенд для размещения
            образцов, либо коробки для компактного размещения.
          </p>
          <Image
            className="mt-10"
            src="/img/stand_large.jpg"
            height={200}
            width={300}
            alt="Вращающийся стенд для мозаики"
          ></Image>
          <Image
            className="mt-10"
            src="/img/stand_black.jpg"
            height={200}
            width={300}
            alt="Черный стенд для мозаики"
          ></Image>
          <Image
            className="mt-10"
            src="/img/boxes.jpg"
            height={300}
            width={450}
            alt="Черный стенд для мозаики"
          ></Image>
          <GrayCardHeader className="text-[20px]  ml-5 md:ml-10 mt-10 ">
            <Link href="/contacts" className="text-sky-600 hover:underline">
              Свяжитесь с нами
            </Link>{" "}
            и узнайте все подробности!
          </GrayCardHeader>
          <GrayCardHeader className="text-[20px]  ml-5 md:ml-10 mt-10 ">
            <Link
              href="https://docs.google.com/spreadsheets/d/11UPZmkONzt4-qUnGUwJlq43ZnE4bJKCcBJ-5GbRPlAE/edit#gid=0"
              className="text-sky-600 hover:underline"
            >
              Текущие остатки мозаики на складе
            </Link>
          </GrayCardHeader>
        </GrayCard>
      </div>
    </div>
  );
}
