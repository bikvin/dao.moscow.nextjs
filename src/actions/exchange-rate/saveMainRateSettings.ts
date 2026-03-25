"use server";

import { db } from "@/db";
import { revalidatePath } from "next/cache";

export interface MainRateFormState {
  errors?: { _form?: string[] };
  success?: { message: string };
}

export async function saveMainRateSettings(
  _formState: MainRateFormState,
  formData: FormData
): Promise<MainRateFormState> {
  const mode = formData.get("mode")?.toString();
  if (!mode || !["official", "markup", "manual"].includes(mode)) {
    return { errors: { _form: ["Выберите режим курса"] } };
  }

  if (mode === "markup") {
    const markup = parseFloat(formData.get("markup")?.toString() ?? "");
    if (isNaN(markup) || markup < 0) {
      return { errors: { _form: ["Укажите корректную наценку ≥ 0"] } };
    }
  }

  if (mode === "manual") {
    const manual = parseFloat(formData.get("manual")?.toString() ?? "");
    if (isNaN(manual) || manual <= 0) {
      return { errors: { _form: ["Укажите корректный курс > 0"] } };
    }
  }

  try {
    await db.settings.upsert({
      where: { field: "usdMainRateMode" },
      update: { value: mode },
      create: { field: "usdMainRateMode", value: mode },
    });

    const officialRateSetting = await db.settings.findUnique({
      where: { field: "usdOfficialRate" },
    });
    const officialRate = officialRateSetting ? parseFloat(officialRateSetting.value) : null;

    if (mode === "official" && officialRate !== null) {
      await db.settings.upsert({
        where: { field: "usdMainRate" },
        update: { value: officialRate.toString() },
        create: { field: "usdMainRate", value: officialRate.toString() },
      });
    }

    if (mode === "markup") {
      const markup = formData.get("markup")?.toString() ?? "0";
      await db.settings.upsert({
        where: { field: "usdMainRateMarkup" },
        update: { value: markup },
        create: { field: "usdMainRateMarkup", value: markup },
      });
      if (officialRate !== null) {
        const mainRate = officialRate * (1 + parseFloat(markup) / 100);
        await db.settings.upsert({
          where: { field: "usdMainRate" },
          update: { value: mainRate.toString() },
          create: { field: "usdMainRate", value: mainRate.toString() },
        });
      }
    }

    if (mode === "manual") {
      const manual = formData.get("manual")?.toString() ?? "0";
      await db.settings.upsert({
        where: { field: "usdMainRateManual" },
        update: { value: manual },
        create: { field: "usdMainRateManual", value: manual },
      });
      await db.settings.upsert({
        where: { field: "usdMainRate" },
        update: { value: manual },
        create: { field: "usdMainRate", value: manual },
      });
    }
  } catch (err: unknown) {
    return {
      errors: {
        _form: [err instanceof Error ? err.message : "Что-то пошло не так"],
      },
    };
  }

  revalidatePath("/admin/exchange-rate");
  return { success: { message: "Сохранено" } };
}
