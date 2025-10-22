// app/api/auth/request-reset/route.ts
import { db } from "@/db";
import { forgotPasswordSchema } from "@/zod/reset-password";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // validate using Zod
    const result = forgotPasswordSchema.safeParse({ email });

    if (!result.success) {
      return Response.json({ ok: true }, { status: 200 }); // don't reveal user existence even if email is wrong
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return Response.json({ ok: true }, { status: 200 }); // don't reveal user existence

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    await resend.emails.send({
      from: "support@dao.moscow",
      to: email,
      subject: "Восстановление пароля",
      html: `
      <p>Вы запросили восстановление пароля.</p>
      <p><a href="${resetUrl}">Для восстановления перейдите по этой ссылке</a></p>
      <p>Ссылка действительна 1 час.</p>
    `,
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.log("error", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
