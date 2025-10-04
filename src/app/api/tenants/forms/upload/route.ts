import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { nanoid } from "nanoid";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const tenantId = req.headers.get("x-tenant-id");
    const role = req.headers.get("x-user-role");

    if (!tenantId)
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    if (role !== "TENANT_ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
    if (rows.length < 1)
      return NextResponse.json({ error: "Empty Excel file" }, { status: 400 });

    // Generate fields from header row
    const headers = rows[0];
    const fields = headers.map((h) => ({ name: h, type: "text", required: false }));

    // Unique slug
    const slug = `form-${nanoid(6)}`;

    // Base URL
    const baseUrl = process.env.APP_URL || "https://mydomain.com";
    const formUrl = `${baseUrl}/f/${slug}`;

    // Generate QR Code (Base64)
    const qrImage = await QRCode.toDataURL(formUrl);

    // Step 1️⃣: Create the form
    const form = await prisma.dynamicForm.create({
      data: {
        name: `Form ${Date.now()}`,
        tenantId,
        slug,
        fields,
      },
    });

    // Step 2️⃣: Create the short link + QR code
    const shortLink = await prisma.shortLink.create({
      data: {
        tenantId,
        flyerId: undefined,
        formId: form.id,
        slug,
        targetPath: formUrl,
        qr: {
          create: {
            imageUrl: qrImage,
            format: "PNG",
          },
        },
      },
      include: { qr: true },
    });

    return NextResponse.json({ success: true, form, shortLink });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to upload Excel" }, { status: 500 });
  }
}
