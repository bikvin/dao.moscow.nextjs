import { ProductReserveListItem } from "./ProductReserveListItem";
import { ProductReserveWithProductVariant } from "@/types/product/productReserve/productReserveWithProductVariant";

export default function ProductReservesList({
  itemsData,
}: {
  itemsData: ProductReserveWithProductVariant[];
}) {
  const grouped = itemsData.reduce(
    (acc, reserve) => {
      const d = new Date(reserve.reserveDate);
      d.setHours(12, 0, 0, 0);
      const date = d.toISOString().slice(0, 10);

      if (!acc[date]) acc[date] = [];
      acc[date].push(reserve);
      return acc;
    },
    {} as Record<string, ProductReserveWithProductVariant[]>,
  );

  return (
    <>
      {itemsData.length === 0 && (
        <div className="text-center text-xl mt-10 font-light tracking-widest">
          Резервов товаров пока нет
        </div>
      )}

      <div className="mt-10">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-8">
            {new Date(date).toLocaleDateString("ru-RU")}
            {items.map((item) => (
              <ProductReserveListItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
