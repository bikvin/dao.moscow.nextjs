import HeroSection from "@/components/client/HeroSection/HeroSection";
import TopMenu from "@/components/client/TopMenu/TopMenu";
import GrayCard from "@/components/common/GrayCard";
import GrayCardHeader from "@/components/common/GrayCardHeader";
import ImageIcon from "@/components/common/ImageIcon";
import LinkButton from "@/components/common/LinkButton";

export const metadata = {
  title: "Компания DAO - красивая мозаика || Главная",
  description:
    "Поставка мраморной, стеклянной и керамической мозаики из Китая. Складская программа в Москве.",
};

export default function Home() {
  return (
    <div className="bg-container">
      <TopMenu page={"main"} />
      <HeroSection />
      <div className="grid grid-cols-1 md:grid-cols-3  gap-4 px-8 pb-[100px]">
        <GrayCard className={"col-span-1"}>
          <GrayCardHeader>Мозаика со склада в Москве</GrayCardHeader>
          <p className="mb-4">
            Предлагаем Вашему вниманию коллекцию красивой мозаики со склада в
            Москве.
          </p>
          <div className="flex justify-center gap-4 mb-10">
            <ImageIcon
              imageLink={`/img/mosaic/thumbs/DAO-17.jpg`}
              targetLink={"/sklad"}
            />
            <ImageIcon
              imageLink={`/img/mosaic/thumbs/DAO-20.jpg`}
              targetLink={"/sklad"}
            />
          </div>
          <div className="flex justify-center">
            <LinkButton href="/sklad" className="" sizeRatio={0.9}>
              Посмотреть коллекцию и цены
            </LinkButton>
          </div>
        </GrayCard>
        <GrayCard className={"col-span-1"}>
          <GrayCardHeader>Партнерам</GrayCardHeader>
          <p className="mb-4">
            Если Вы управляете магазином или интернет-магазином, продающим
            мозаику, сотрудничество с нами может быть Вам интересно.
          </p>
          <p className="mb-4">
            Благодаря прямым поставкам нам удается сохранять очень
            привлекательные цены.
          </p>
          <p className="mb-4">
            Кроме того, мы бесплатно предоставим необходимое количество образцов
            для выставления в торговом зале.
          </p>
          <div className="flex justify-center">
            <LinkButton href="/partners" className="" sizeRatio={0.9}>
              Узнайте подробнее про сотрудничество
            </LinkButton>
          </div>
        </GrayCard>
        <GrayCard className={"col-span-1"}>
          <GrayCardHeader>Продукция под заказ из Китая</GrayCardHeader>
          <p className="">
            Кроме складской программы мы можем предложить большой выбор мозаики,
            мрамора и гранита под заказ с доставкой из Китая.
          </p>
        </GrayCard>
      </div>
    </div>
  );
}
