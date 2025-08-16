// api/tenants/index.ts
import prisma from '@/lib/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const tenants = await prisma.tenant.findMany({
        include: { subscriptions: true, users: true },
      });
      return res.status(200).json(tenants);
    }

    if (req.method === 'POST') {
      const { name, slug, plan, primaryColor, accentColor, logoUrl, domain } = req.body;

      const tenant = await prisma.tenant.create({
        data: {
          name,
          slug,
          plan,
          primaryColor,
          accentColor,
          logoUrl,
          domain,
          subscriptions: {
            create: { plan, startDate: new Date(), status: 'ACTIVE' },
          },
        },
      });
      return res.status(201).json(tenant);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
