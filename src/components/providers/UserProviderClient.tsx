"use client";

import { createContext, useContext } from "react";

interface UserContextType {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProviderClient({
  user,
  children,
}: {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  children: React.ReactNode;
}) {
  const isAdmin = user.role === "ADMIN";

  return (
    <UserContext.Provider value={{ ...user, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
}
