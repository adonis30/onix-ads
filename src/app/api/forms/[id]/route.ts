import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const form = await prisma.dynamicForm.findUnique({
      where: { id },
      include: {
        settings: true,
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, schema, published } = body;

    // Get current form to create version
    const currentForm = await prisma.dynamicForm.findUnique({
      where: { id },
    });

    if (!currentForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Update form and create version
    const [updatedForm] = await prisma.$transaction([
      prisma.dynamicForm.update({
        where: { id },
        data: {
          name,
          description,
          schema,
          published,
          version: { increment: 1 },
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      }),
      // Create version history
      prisma.formVersion.create({
        data: {
          formId: id,
          version: currentForm.version + 1,
          schema: currentForm.schema,
          createdBy: session.user.id,
          changeLog: 'Form updated',
        },
      }),
      // Create audit log
      prisma.formAuditLog.create({
        data: {
          formId: id,
          action: 'UPDATED',
          userId: session.user.id,
          userName: session.user.name || session.user.email,
          changes: {
            name,
            description,
            published,
          },
        },
      }),
    ]);

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.dynamicForm.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
  }
}
