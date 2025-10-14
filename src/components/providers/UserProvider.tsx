// UserProvider.tsx
import { auth } from "@/auth";
import { UserProviderClient } from "./UserProviderClient";

export async function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <UserProviderClient
      user={{
        id: session?.user?.id ?? "",
        name: session?.user?.name ?? "",
        email: session?.user?.email ?? "",
        role: session?.user?.role ?? "USER",
      }}
    >
      {children}
    </UserProviderClient>
  );
}
