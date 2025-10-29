'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ShoppingCart, DollarSign } from 'lucide-react';

export default function AdminFlyersPage() {
  const [flyers, setFlyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchFlyers();
  }, [page]);

  const fetchFlyers = async () => {
    setLoading(true);
    const res = await fetch(`/api/super/flyers?page=${page}&limit=20`);
    const data = await res.json();
    setFlyers(data.flyers || []);
    setTotalPages(data.pagination?.pages || 1);
    setStats(data.stats);
    setLoading(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">All Flyers</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flyers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalFlyers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${((stats?.totalRevenue || 0) / 100).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPurchases || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Flyers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flyers.map((flyer) => (
              <div key={flyer.id} className="flex justify-between items-center border p-4 rounded">
                <div className="flex-1">
                  <p className="font-medium">{flyer.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {flyer.tenant.name} · {flyer.campaign.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {flyer.purchaseCount} purchases
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {flyer.isFree ? 'FREE' : `$${((flyer.priceCents || 0) / 100).toFixed(2)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(flyer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
