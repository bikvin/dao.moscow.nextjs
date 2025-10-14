"use server";

import { db } from "@/db";
import { createUserSchema } from "@/zod/user";
import { UserRoleEnum } from "@prisma/client";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

interface CreateUserFormState {
  errors: {
    name?: string[];
    email?: string[];
    password?: string[];
    repeatPassword?: string[];
    _form?: string[];
  };
}

export async function createUser(
  formState: CreateUserFormState,
  formData: FormData
): Promise<CreateUserFormState> {
  try {
    const usersCount = await db.user.count();

    const role: UserRoleEnum = usersCount === 0 ? "ADMIN" : "USER";

    const result = createUserSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      repeatPassword: formData.get("repeatPassword"),
    });

    if (!result.success) {
      console.log(result.error.flatten().fieldErrors);

      return {
        errors: result.error.flatten().fieldErrors,
      };
    }

    const email = result.data.email.toLowerCase();

    // check we don't already have the user with this email
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        errors: { _form: ["Пользователь с таким email уже существует"] },
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(result.data.password, 10);

    await db.user.create({
      data: {
        name: result.data.name,
        email,
        password: hashedPassword,
        role,
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
        errors: { _form: ["Что-то пошло не так"] },
      };
    }
  }

  revalidatePath("/admin/users/all-users");

  redirect("/admin/users/all-users");
}
