// app/api/auth/reset-password/route.ts
import { db } from "@/db";
import { resetPasswordSchemaServer } from "@/zod/reset-password";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    // validate using Zod
    const result = resetPasswordSchemaServer.safeParse({ password });

    if (!result.success) {
      return Response.json(
        {
          ok: false,
          error:
            "Неверный пароль. Попробуйте запросить востановление пароля снова.",
        },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return Response.json(
        {
          ok: false,
          error:
            "Неверный токен. Попробуйте запросить востановление пароля снова.",
        },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.log("error", err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
