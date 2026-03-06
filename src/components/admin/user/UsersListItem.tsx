import React from "react";
import { User, UserRoleEnum } from "@prisma/client";
import DeleteDialog from "@/components/common/delete/DeleteDialog";
import { deleteUser } from "@/actions/user/delete";
import { RiEdit2Line } from "react-icons/ri";
import Link from "next/link";

const roleLabel: Record<UserRoleEnum, string> = {
  [UserRoleEnum.ADMIN]: "Администратор",
  [UserRoleEnum.USER]: "Пользователь",
};

const roleColor: Record<UserRoleEnum, string> = {
  [UserRoleEnum.ADMIN]: "text-sky-600",
  [UserRoleEnum.USER]: "text-slate-400",
};

export function UsersListItem({ user }: { user: User }) {
  return (
    <div className="border rounded-md mb-2 p-3 shadow-main">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-4">
          <h4 className="text-xl font-medium">{user.name}</h4>
          <span className={`text-sm font-medium ${roleColor[user.role]}`}>
            {roleLabel[user.role]}
          </span>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/users/update/${user.id}`}>
            <RiEdit2Line className="w-5 h-5 hover:text-blue-700 hover:scale-125 cursor-pointer" />
          </Link>
          {user.role !== UserRoleEnum.ADMIN && (
            <DeleteDialog
              id={user.id}
              action={deleteUser}
              message={`Вы уверены, что хотите удалить пользователя ${user.name}`}
            />
          )}
        </div>
      </div>
      <div className="text-sm text-slate-400">{user.email}</div>
    </div>
  );
}
