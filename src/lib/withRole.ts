// src/lib/withRole.ts
import { NextRequest, NextResponse } from "next/server";

export function withRole(handler: Function, allowedRoles: string[]) {
  return async (req: NextRequest) => {
    try {
      const role = req.headers.get("x-user-role"); // or get from session/JWT
      if (!role || !allowedRoles.includes(role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      return await handler(req);
    } catch (err: any) {
      console.error(err);
      return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
  };
}
