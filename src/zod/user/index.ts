import { z } from "zod";

const baseUserSchema = z.object({
  name: z.string().min(3, { message: "Минимум 3 символа" }),
  email: z.string().email({ message: "Введите корректный адрес почты" }),
});

export const createUserSchema = baseUserSchema
  .extend({
    password: z.string().min(6, { message: "Минимум 6 символов" }),
    repeatPassword: z.string().min(6, { message: "Минимум 6 символов" }),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"], // path of error
  });

export const editUserSchema = baseUserSchema
  .extend({
    id: z.string().uuid({ message: "Неверный id" }),
    password: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional(),
    repeatPassword: z
      .string()
      .transform((val) => (val === "" ? undefined : val))
      .optional(),
  })
  .superRefine((data, ctx) => {
    // If both empty → OK
    if (!data.password && !data.repeatPassword) return;

    if (data.password && data.password.length < 6) {
      ctx.addIssue({
        code: "too_small",
        minimum: 6,
        type: "string",
        inclusive: true,
        message: "Минимум 6 символов",
        path: ["password"],
      });
    }

    if (data.password !== data.repeatPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Пароли не совпадают",
        path: ["repeatPassword"],
      });
    }
  });
