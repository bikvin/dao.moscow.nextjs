import { UserProvider } from "@/components/providers/UserProvider";
import "../globals.css";

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
