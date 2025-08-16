// src/app/api/flyers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { AuthOptions } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const flyerId = params.id;
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

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } } // still typed
) {
  const session = await getServerSession(authOptions as AuthOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Await params
    const { id: flyerId } = await context.params;

    await prisma.flyer.delete({ where: { id: flyerId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete flyer" }, { status: 500 });
  }
}

