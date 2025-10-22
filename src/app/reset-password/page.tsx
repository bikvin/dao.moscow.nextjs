"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { resetPasswordSchema } from "@/zod/reset-password";
import { ZodIssue } from "zod";
import FormButtonJs from "@/components/common/formButton/formButtonJs";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [token, setToken] = useState("");

  const [status, setStatus] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ZodIssue[] | null>(null);

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get("token");
    if (!urlToken) {
      setStatus({ text: "Неверная ссылка для восстановления", type: "error" });
      setValidating(false);
      return;
    }

    setToken(urlToken);

    // Validate token
    (async () => {
      const res = await fetch("/api/auth/validate-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: urlToken }),
      });

      const data = await res.json();
      if (data.ok) {
        setTokenValid(true);
      } else {
        setStatus({
          text: "Неверная ссылка для восстановления",
          type: "error",
        });
      }
      setValidating(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);

    // validate using Zod
    const result = resetPasswordSchema.safeParse({ password, repeatPassword });

    if (!result.success) {
      console.log("result.error.issues", result.error.issues);
      setError(result.error.issues);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();

    setStatus(
      data.ok
        ? {
            text: "Пароль успешно изменен.",
            type: "success",
          }
        : { text: "Произошла ошибка", type: "error" }
    );

    setLoading(false);
    setPassword("");
    setRepeatPassword("");
  }

  if (validating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="error text-xl">{status?.text}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-[90%] md:w-2/3 mx-auto">
        <h1 className="admin-form-header mt-10">Восстановление пароля</h1>
        <form onSubmit={handleSubmit} className="admin-form">
          <input
            type="password"
            placeholder="Новый пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className=""
          />
          {error && (
            <p className="error mb-4">
              {error.find((e) => e.path.includes("password"))?.message}
            </p>
          )}

          <input
            type="password"
            placeholder="Повторите пароль"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className=""
          />
          {error && (
            <p className="error mb-4">
              {error
                .filter((e) => e.path.includes("repeatPassword"))
                .map((e) => e.message)
                .join(", ")}
            </p>
          )}

          <FormButtonJs pending={loading} message={status}>
            Изменить пароль
          </FormButtonJs>
        </form>
      </div>
    </div>
  );
}
