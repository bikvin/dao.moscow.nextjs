import { z } from "zod";

export const editImagesSchema = z.object({
  imagesArrString: z
    .string()
    .min(1, { message: "Строка с данными не может быть пустой" }),
  imageGroup: z.string().min(1, { message: "Не указана группа картинок" }),
});
