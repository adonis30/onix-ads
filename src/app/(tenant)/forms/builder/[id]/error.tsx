'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage() {
  useEffect(() => {
    console.error('An error occurred in the form builder page.');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20 px-6 bg-gray-900/50 rounded-xl border border-gray-800 shadow-inner">
      <AlertTriangle className="w-10 h-10 text-red-400 mb-4" />
      <h2 className="text-2xl font-semibold text-white mb-3">
        Something went wrong
      </h2>
      <p className="text-gray-400 max-w-md">
        An unexpected error occurred while loading the form builder. Please try refreshing the page or come back later.
      </p>

      <Button asChild className="mt-6">
        <Link href="/forms">Go back to Forms</Link>
      </Button>
    </div>
  );
}
