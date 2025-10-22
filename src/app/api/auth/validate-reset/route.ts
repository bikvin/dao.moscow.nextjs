import { db } from "@/db";

export async function POST(req: Request) {
  const { token } = await req.json();

  const user = await db.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
    select: { id: true },
  });

  if (!user) {
    return Response.json(
      { ok: false, error: "Неверная или просроченная ссылка" },
      { status: 400 }
    );
  }

  return Response.json({ ok: true });
}
