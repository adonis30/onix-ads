import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuthOptions } from "next-auth";

import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/authOptions";

export async function PATCH(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const flyerId = context.params.id as string;
    const body = await req.json();
    const { title, description, assetType } = body;

    const updated = await prisma.flyer.update({
      where: { id: flyerId },
      data: { title, description, assetType },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update flyer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const flyerId = context.params.id as string;

    await prisma.flyer.delete({ where: { id: flyerId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete flyer" }, { status: 500 });
  }
}
