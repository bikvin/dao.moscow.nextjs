import { ProductReserveListItem } from "./ProductReserveListItem";
import { ProductReserveWithProductVariant } from "@/types/product/productReserve/productReserveWithProductVariant";
import { ProductDateGroupedList } from "../ProductDateGroupedList";

export default function ProductReservesList({
  itemsData,
}: {
  itemsData: ProductReserveWithProductVariant[];
}) {
  return (
    <ProductDateGroupedList
      items={itemsData}
      getDate={(item) => item.reserveDate}
      emptyMessage="Резервов товаров пока нет"
      renderItem={(item) => <ProductReserveListItem key={item.id} item={item} />}
    />
  );
}
