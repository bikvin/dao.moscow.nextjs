// import classes from "./accordionItemsEdit.module.css";
import { db } from "@/db";
import { UsersListItem } from "./UsersListItem";

export default async function UsersList() {
  const itemsData = await db.user.findMany({
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <>
      {itemsData.length === 0 && (
        <div className="text-center text-xl mt-10 font-light tracking-widest">
          Статей пока нет
        </div>
      )}
      <div className={`mt-10`}>
        {itemsData.map((item) => (
          <UsersListItem key={item.id} user={item} />
        ))}
      </div>
    </>
  );
}
