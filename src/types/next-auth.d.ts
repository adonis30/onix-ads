// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      tenantId: string | null;
      role: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    tenantId: string | null;
    role: string;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    tenantId: string | null;
    role: string;
  }
}
declare module "next-auth/providers" {
  interface Credentials {
    email: string;
    password: string;
  }
}
declare module "next-auth/core/types" {
  interface AuthOptions {
    providers: any[];
    callbacks: {
      jwt?: (params: any) => Promise<any>;
      session?: (params: any) => Promise<any>;
    };
    pages?: {
      signIn?: string;
    };
    session?: {
      strategy: "jwt";
    };
    secret?: string;
  }
}
declare module "next-auth/core" {
  interface NextAuthOptions extends AuthOptions {}
}
declare module "next-auth/core/routes" {
  interface NextAuthRoute {
    options: AuthOptions;
  }
}
declare module "next-auth/core/types" {
  interface NextAuthConfig {
    options: AuthOptions;
  }
}
declare module "next-auth/core/providers" {
  interface NextAuthProvider {
    name: string;
    type: "credentials";
    credentials: {
      email: { label: string; type: string };
      password: { label: string; type: string };
    };
    authorize?: (credentials: Credentials) => Promise<User | null>;
  }
}
declare module "next-auth/core/callbacks" {
  interface NextAuthCallbacks {
    jwt?: (params: any) => Promise<any>;
    session?: (params: any) => Promise<any>;
  }
}
