import { z } from "zod";

export const editUserSchema = z
  .object({
    name: z.string().min(3, { message: "Минимум 3 символа" }),
    email: z.string().email({ message: "Введите корректный адрес почты" }),
    password: z.string().min(6, { message: "Минимум 6 символов" }),
    repeatPassword: z.string().min(6, { message: "Минимум 6 символов" }),
    id: z.string().cuid({ message: "Неверный id пользователя" }),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"], // path of error
  });

export const createUserSchema = z
  .object({
    name: z.string().min(3, { message: "Минимум 3 символа" }),
    email: z.string().email({ message: "Введите корректный адрес почты" }),
    password: z.string().min(6, { message: "Минимум 6 символов" }),
    repeatPassword: z.string().min(6, { message: "Минимум 6 символов" }),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"], // path of error
  });
