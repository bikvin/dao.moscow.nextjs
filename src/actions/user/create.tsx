"use server";

import { db } from "@/db";
import { createUserSchema } from "@/zod/user";
import bcrypt from "bcrypt";
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
    // Check that there is no users in the db
    const existingUsersCount = await db.user.count();

    if (existingUsersCount > 0) {
      return {
        errors: {
          _form: ["Пользователь уже создан. Пожалуйста залогиньтесь."],
        },
      };
    }

    const result = createUserSchema.safeParse({
      id: formData.get("id"),
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

    // Hash password
    const hashedPassword = await bcrypt.hash(result.data.password, 10);

    await db.user.create({
      data: {
        name: result.data.name,
        email: result.data.email,
        password: hashedPassword,
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

  redirect("/");
}
