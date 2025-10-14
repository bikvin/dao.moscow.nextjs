import React from "react";
import { User } from "@prisma/client";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { deleteUser } from "@/actions/user/delete";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";
import Image from "next/image";

export function UsersListItem({ user }: { user: User }) {
  return (
    <div className="relative flex flex-col border rounded-md mb-4 p-2 shadow-main">
      <div className="absolute top-4 right-4 flex gap-2 flex-col">
        <DeleteDialog
          id={user.id}
          action={deleteUser}
          message={`Вы уверены, что хотите удалить пользователя ${user.name}`}
        />
        <Link className="" href={`/admin/users/update/${user.id}`}>
          <RiEdit2Line className="w-6 h-6 hover:text-blue-700 hover:scale-125 cursor-pointer" />
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-start items-center">
        <div className="p-4">
          <h4 className="text-2xl">{user.name}</h4>
          <div className="text-base">{user.email}</div>
        </div>
      </div>
    </div>
  );
}
