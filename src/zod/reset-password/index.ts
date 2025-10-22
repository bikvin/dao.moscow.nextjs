import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email("Введите корректный email"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(6, { message: "Минимум 6 символов" }),
    repeatPassword: z.string().min(6, { message: "Минимум 6 символов" }),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Пароли не совпадают",
    path: ["repeatPassword"], // path of error
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const resetPasswordSchemaServer = z.object({
  password: z.string().min(6, { message: "Минимум 6 символов" }),
});

export type resetPasswordSchemaServer = z.infer<
  typeof resetPasswordSchemaServer
>;
