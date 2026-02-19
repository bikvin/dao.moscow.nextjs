import { ProductIssueListItem } from "./ProductIssueListItem";
import { ProductIssueWithProductVariant } from "@/types/product/productIssue/productIssueWithProductVariant";

export default async function ProductIssuesList({
  itemsData,
}: {
  itemsData: ProductIssueWithProductVariant[];
}) {
  const grouped = itemsData.reduce((acc, issue) => {
    const d = new Date(issue.issueDate);
    d.setHours(12, 0, 0, 0);
    const date = d.toISOString().slice(0, 10);

    if (!acc[date]) acc[date] = [];
    acc[date].push(issue);
    return acc;
  }, {} as Record<string, ProductIssueWithProductVariant[]>);

  return (
    <>
      {itemsData.length === 0 && (
        <div className="text-center text-xl mt-10 font-light tracking-widest">
          Списаний товаров пока нет
        </div>
      )}

      <div className={`mt-10`}>
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="mb-8">
            {new Date(date).toLocaleDateString("ru-RU")}
            {items.map((item) => (
              <ProductIssueListItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
