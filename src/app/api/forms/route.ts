import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const [forms, total] = await Promise.all([
      prisma.dynamicForm.findMany({
        where: {
          tenantId: session.user.tenantId,
        },
        include: {
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dynamicForm.count({
        where: {
          tenantId: session.user.tenantId,
        },
      }),
    ]);

    return NextResponse.json({
      forms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, schema, isTemplate, templateCategory } = body;

    // Generate unique slug
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const form = await prisma.dynamicForm.create({
      data: {
        name,
        description,
        slug,
        schema,
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
        isTemplate: isTemplate || false,
        templateCategory,
        version: 1,
        isLatest: true,
      },
    });

    // Create audit log
    await prisma.formAuditLog.create({
      data: {
        formId: form.id,
        action: 'CREATED',
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        changes: {
          name,
          description,
        },
      },
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
