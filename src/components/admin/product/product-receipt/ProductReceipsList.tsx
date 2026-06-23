import { ProductReceiptListItem } from "./ProductReceiptListItem";
import { ProductReceiptWithProductVariant } from "@/types/product/productReceipt/productReceiptWithProductVariant";
import { ProductDateGroupedList } from "../ProductDateGroupedList";

export default function ProductReceiptsList({
  itemsData,
  isAdmin,
}: {
  itemsData: ProductReceiptWithProductVariant[];
  isAdmin?: boolean;
}) {
  return (
    <ProductDateGroupedList
      items={itemsData}
      getDate={(item) => item.receiptDate}
      emptyMessage="Поступлений товаров пока нет"
      renderItem={(item) => <ProductReceiptListItem key={item.id} item={item} isAdmin={isAdmin} />}
    />
  );
}
