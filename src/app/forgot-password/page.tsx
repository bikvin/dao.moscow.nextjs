// app/forgot-password/page.tsx
"use client";

import FormButtonJs from "@/components/common/formButton/formButtonJs";
import { forgotPasswordSchema } from "@/zod/reset-password";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // validate using Zod
    const result = forgotPasswordSchema.safeParse({ email });

    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    setStatus(null);

    const res = await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    console.log("res", res);
    const data = await res.json();

    setStatus(
      data.ok
        ? {
            text: "Проверьте вашу почту. Письмо со ссылкой для восстановления отправлено.",
            type: "success",
          }
        : { text: "Произошла ошибка", type: "error" }
    );

    setLoading(false);
    setEmail("");
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-[90%] md:w-2/3 mx-auto">
        <h1 className="admin-form-header mt-10">Восстановление пароля</h1>
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            type="email"
            placeholder="Ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className=""
          />
          {error && <p className="error mb-4">{error}</p>}

          <FormButtonJs pending={loading} message={status}>
            Отправить ссылку для восстановления
          </FormButtonJs>
        </form>
      </div>
    </div>
  );
}
