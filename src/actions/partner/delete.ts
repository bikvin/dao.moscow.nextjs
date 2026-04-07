"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deletePartner(formData: FormData): Promise<void> {
  const id = formData.get("id") as string;
  await db.partner.delete({ where: { id } });
  revalidatePath("/admin/partners");
  redirect("/admin/partners");
}
