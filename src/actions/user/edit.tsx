"use server";

import { db } from "@/db";
import bcrypt from "bcrypt";
import { editUserSchema } from "@/zod/user";

import { redirect } from "next/navigation";

interface EditUserFormState {
  errors: {
    id?: string[];
    name?: string[];
    email?: string[];
    password?: string[];
    repeatPassword?: string[];
    _form?: string[];
  };
}

export async function editUser(
  formState: EditUserFormState,
  formData: FormData
): Promise<EditUserFormState> {
  const result = editUserSchema.safeParse({
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

  try {
    await db.user.update({
      where: {
        id: result.data.id,
      },
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
        errors: {
          _form: ["Something went wrong"],
        },
      };
    }
  }

  redirect("/admin");
}
