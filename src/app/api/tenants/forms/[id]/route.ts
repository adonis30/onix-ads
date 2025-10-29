// src/app/api/tenants/forms/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRoleAndTenant } from '@/lib/withRoleAndTenant';

export const PATCH = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const url = new URL(req.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return NextResponse.json({ error: 'Form ID required' }, { status: 400 });
      }

      const body = await req.json();
      const { fields, published } = body;

      // Verify ownership
      const form = await prisma.dynamicForm.findUnique({
        where: { id },
        select: { tenantId: true, published: true },
      });

      if (!form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      if (form.tenantId !== user.tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Don't allow editing published forms
      if (form.published && published !== undefined) {
        return NextResponse.json(
          { error: 'Cannot edit published forms' },
          { status: 400 }
        );
      }

      // Update form
      const updated = await prisma.dynamicForm.update({
        where: { id },
        data: {
          fields: fields ? JSON.stringify(fields) : undefined,
          published: published !== undefined ? published : undefined,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, form: updated });
    } catch (error: any) {
      console.error('[Forms PATCH] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);

export const GET = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const url = new URL(req.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return NextResponse.json({ error: 'Form ID required' }, { status: 400 });
      }

      const form = await prisma.dynamicForm.findUnique({
        where: { id },
      });

      if (!form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      if (form.tenantId !== user.tenantId && user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      return NextResponse.json(form);
    } catch (error: any) {
      console.error('[Forms GET] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
  },
  ['TENANT_ADMIN', 'EDITOR', 'VIEWER', 'SUPER_ADMIN']
);

export const DELETE = withRoleAndTenant(
  async (req: NextRequest, user) => {
    try {
      const url = new URL(req.url);
      const id = url.pathname.split('/').pop();

      if (!id) {
        return NextResponse.json({ error: 'Form ID required' }, { status: 400 });
      }

      // Verify ownership
      const form = await prisma.dynamicForm.findUnique({
        where: { id },
        select: { tenantId: true },
      });

      if (!form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }

      if (form.tenantId !== user.tenantId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      await prisma.dynamicForm.delete({
        where: { id },
      });

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Forms DELETE] Error:', error);
      return NextResponse.json(
        { error: 'Internal server error', details: error.message },
        { status: 500 }
      );
    }
  },
  ['TENANT_ADMIN', 'SUPER_ADMIN']
);
