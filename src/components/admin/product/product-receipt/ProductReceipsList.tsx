import { ProductReceiptListItem } from "./ProductReceiptListItem";
import { ProductReceiptWithProductVariant } from "@/types/product/productReceipt/productReceiptWithProductVariant";

export default async function ProductReceiptsList({
  itemsData,
}: {
  itemsData: ProductReceiptWithProductVariant[];
}) {
  const grouped = itemsData.reduce(
    (acc, receipt) => {
      const d = new Date(receipt.receiptDate);
      d.setHours(12, 0, 0, 0);
      const date = d.toISOString().slice(0, 10); // YYYY-MM-DD

      if (!acc[date]) acc[date] = [];
      acc[date].push(receipt);
      return acc;
    },
    {} as Record<string, ProductReceiptWithProductVariant[]>,
  );

  return (
    <>
      {itemsData.length === 0 && (
        <div className="text-center text-xl mt-10 font-light tracking-widest">
          Поступлений товаров пока нет
        </div>
      )}

      <div className={`mt-10`}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-8">
            {new Date(date).toLocaleDateString("ru-RU")}
            {items.map((item) => (
              <ProductReceiptListItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
