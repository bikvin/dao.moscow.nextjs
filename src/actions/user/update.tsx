"use server";

import { db } from "@/db";
import bcrypt from "bcryptjs";
import { editUserSchema } from "@/zod/user";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { UserFormState } from "./UserFormState";

export async function updateUser(
  formState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const result = editUserSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    repeatPassword: formData.get("repeatPassword"),
  });

  console.log(result);
  console.log(result.error?.flatten().fieldErrors);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { id, name, email, password } = result.data;

  const passwordUpdate =
    password && password.length > 0
      ? { password: await bcrypt.hash(password, 10) }
      : {};
  // // Hash password
  // const hashedPassword = await bcrypt.hash(result.data.password, 10);

  try {
    await db.user.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        ...passwordUpdate,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return {
        errors: {
          _form: [err.message],
        },
      };
    } else {
      return {
        errors: {
          _form: ["Something went wrong"],
        },
      };
    }
  }

  revalidatePath("/admin/users/all-users");

  redirect("/admin/users/all-users");
}
