// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import type { UserRoleEnum } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRoleEnum;
      name: string;
      email: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRoleEnum;
    name: string;
    email: string;
  }

  declare module "next-auth/jwt" {
    interface JWT {
      id: string;
      role: UserRoleEnum;
      name: string;
      email: string;
    }
  }
}
