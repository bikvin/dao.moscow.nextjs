import { ProductIssueListItem } from "./ProductIssueListItem";
import { ProductIssueWithProductVariant } from "@/types/product/productIssue/productIssueWithProductVariant";
import { ProductDateGroupedList } from "../ProductDateGroupedList";

export default function ProductIssuesList({
  itemsData,
  isAdmin,
}: {
  itemsData: ProductIssueWithProductVariant[];
  isAdmin?: boolean;
}) {
  return (
    <ProductDateGroupedList
      items={itemsData}
      getDate={(item) => item.issueDate}
      emptyMessage="Списаний товаров пока нет"
      renderItem={(item) => <ProductIssueListItem key={item.id} item={item} isAdmin={isAdmin} />}
    />
  );
}
