// api/tenants/[id].ts
import prisma from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const tenant = await prisma.tenant.findUnique({
        where: { id: String(id) },
        include: { subscriptions: true, users: true },
      });
      return res.status(200).json(tenant);
    }

    if (req.method === 'PUT') {
      const { name, slug, plan, primaryColor, accentColor, logoUrl, domain } = req.body;

      const updatedTenant = await prisma.tenant.update({
        where: { id: String(id) },
        data: { name, slug, plan, primaryColor, accentColor, logoUrl, domain },
      });
      return res.status(200).json(updatedTenant);
    }

    if (req.method === 'DELETE') {
      await prisma.tenant.delete({ where: { id: String(id) } });
      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
