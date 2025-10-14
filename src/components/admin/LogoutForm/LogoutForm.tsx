import { logout } from "@/actions/auth";

export function LogoutForm() {
  return (
    <form action={logout}>
      <button className={`text-red-800 hover:underline`} type="submit">
        Выйти
      </button>
    </form>
  );
}
