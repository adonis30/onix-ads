import { NextRequest, NextResponse } from "next/server";

// GET method
export async function GET(req: NextRequest, context: any) {
  const tenantId = context.params.tenantId as string;

  // Example response
  return NextResponse.json({ message: `Tenant ID is ${tenantId}` });
}
