// src/types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      tenantId: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    tenantId: string;
    role: string;
  }
}
