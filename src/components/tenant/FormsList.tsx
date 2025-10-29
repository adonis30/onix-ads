'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { apiFetchJson } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Eye, FileText, Wrench, ToggleLeft } from 'lucide-react';

interface Form {
  id: string;
  name: string;
  slug: string;
  description?: string;
  visits: number;
  submissions: number;
  createdAt: string;
  published: boolean;
}

export default function FormsList({
  tenantId,
  session,
}: {
  tenantId?: string;
  session: any;
}) {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = async () => {
    if (!tenantId) return;
    try {
      const data = await apiFetchJson<Form[]>(
        `/api/tenants/forms?tenantId=${tenantId}`,
        { method: 'GET' },
        session
      );
      setForms(data);
    } catch (err) {
      console.error('[FormsList] Failed to fetch forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [tenantId, session]);

  const togglePublish = async (id: string) => {
    try {
      const res = await apiFetchJson<{ success: boolean }>(
        `/api/tenants/forms/${id}/publish`,
        {
          method: 'PATCH',
          body: JSON.stringify({ id }),
        },
        session
      );
      if (res?.success) {
        setForms((prev) =>
          prev.map((f) => (f.id === id ? { ...f, published: !f.published } : f))
        );
      }
    } catch (err) {
      console.error('[FormsList] Toggle publish failed:', err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl bg-gray-800/30" />
        ))}
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-gray-400 text-sm mt-6 border border-gray-800 rounded-lg p-6 text-center bg-gray-900/40">
        No forms created yet. Click{' '}
        <span className="text-blue-400 font-medium">“Create Form”</span> to get started.
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10 mt-6 justify-center"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {forms.map((form) => (
        <motion.div key={form.id} variants={cardVariants} className="flex justify-center">
          <Card className="w-full max-w-2xl bg-gray-900/80 border border-gray-800 hover:border-blue-500 transition-all duration-300 shadow-md hover:shadow-blue-500/10 h-[280px] flex flex-col justify-between overflow-hidden rounded-xl relative">
            {/* ✅ Published Badge */}
            <div
              className={`absolute top-3 right-3 text-[11px] px-2 py-1 rounded-md font-semibold ${
                form.published
                  ? 'bg-green-500/10 text-green-400 border border-green-600/30'
                  : 'bg-gray-700/40 text-gray-400 border border-gray-600/20'
              }`}
            >
              {form.published ? 'Published' : 'Draft'}
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-white truncate w-[85%]">
                  {form.name}
                </CardTitle>
                <FileText className="h-5 w-5 text-blue-400 flex-shrink-0" />
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-4 px-5 flex flex-col justify-between flex-grow">
              <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                {form.description || 'No description provided.'}
              </p>

              <Separator className="bg-gray-700/50 mb-3" />

              <div className="flex justify-between items-center text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-gray-500" />
                  {form.visits} visits
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-4 h-4 text-gray-500" />
                  {new Date(form.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* ✅ Bottom actions */}
              <div className="flex justify-between items-center mt-3">
                <button
                  onClick={() =>
                    window.open(`/forms/builder/${form.id}`, '_blank')
                  }
                  className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300 font-medium"
                >
                  <Wrench className="w-4 h-4" /> Build Form
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePublish(form.id)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400"
                  >
                    <ToggleLeft className="w-4 h-4" />
                    {form.published ? 'Unpublish' : 'Publish'}
                  </button>

                  <button
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                    onClick={() =>
                      window.open(
                        form.published
                          ? `/forms/${form.slug}`
                          : `/forms/builder/${form.id}`,
                        '_blank'
                      )
                    }
                  >
                    {form.published ? 'View →' : 'Edit →'}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
