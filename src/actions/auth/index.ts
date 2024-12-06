"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function login(prevState: string | undefined, formData: FormData) {
  try {
    // await new Promise((resolve) => setTimeout(resolve, 2500));
    console.log("login action");

    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Неверная почта или пароль.";
        default:
          return "Что-то пошло не так.";
      }
    }
  }

  redirect("/admin");
}

export async function logout() {
  return signOut();
}
