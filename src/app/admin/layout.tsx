import { UserProvider } from "@/components/providers/UserProvider";
import "../globals.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <UserProvider>
      <div className={`font-open-sans`}>{children}</div>
    </UserProvider>
  );
}
