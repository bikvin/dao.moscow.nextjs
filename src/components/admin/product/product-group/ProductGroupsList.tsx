// import classes from "./accordionItemsEdit.module.css";

import { ProductGroup } from "@prisma/client";
import { ProductGroupListListItem } from "./ProductGroupListItem";

export default async function ProductGroupsList({
  itemsData,
}: {
  itemsData: ProductGroup[];
}) {
  return (
    <>
      {itemsData.length === 0 && (
        <div className="text-center text-xl mt-10 font-light tracking-widest">
          Пользователей пока нет
        </div>
      )}
      <div className={`mt-10`}>
        {itemsData.map((item) => (
          // <UsersListItem key={item.id} user={item} />
          <ProductGroupListListItem key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}
