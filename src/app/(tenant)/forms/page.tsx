'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetchJson } from '@/lib/api';
import { Separator } from '@/components/ui/separator';
import CreateFormButton from '@/components/CreateFormButton';
import StatsCards from '@/components/tenant/StatsCards';
import FormsList from '@/components/tenant/FormsList';

interface FormStats {
  visits: number;
  submissions: number;
  conversionRate: number;
  bounceRate: number;
}

export default function FormsPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<FormStats>({
    visits: 0,
    submissions: 0,
    conversionRate: 0,
    bounceRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (status !== 'authenticated' || !session) return;

      try {
        const data = await apiFetchJson<FormStats>(
          '/api/tenants/forms/stats',
          { method: 'GET' },
          session
        );

        setStats({
          visits: data.visits ?? 0,
          submissions: data.submissions ?? 0,
          conversionRate: data.conversionRate ?? 0,
          bounceRate: data.bounceRate ?? 0,
        });
      } catch (err) {
        console.error('[FormsPage] Failed to load form stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [status, session]);

  return (
    <div className="container pt-6">
      <h1 className="text-3xl font-bold mb-4 text-white">Forms Overview</h1>
      <Separator className="my-6" />

      <StatsCards stats={stats} loading={loading} />

      <Separator className="my-10" />
      <h2 className="text-2xl font-semibold text-white mb-4">Your Forms</h2>
       <CreateFormButton />
      <FormsList tenantId={session?.user?.tenantId ?? undefined} session={session} />
    </div>
  );
}





