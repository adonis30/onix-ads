'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCampaigns();
  }, [page]);

  const fetchCampaigns = async () => {
    setLoading(true);
    const res = await fetch(`/api/super/campaigns?page=${page}&limit=20`);
    const data = await res.json();
    setCampaigns(data.campaigns || []);
    setTotalPages(data.pagination?.pages || 1);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    
    const res = await fetch(`/api/super/campaigns?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Campaign deleted');
      fetchCampaigns();
    } else {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">All Campaigns</h1>

      <Card>
        <CardHeader>
          <CardTitle>Platform Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex justify-between items-center border p-4 rounded">
                <div className="flex-1">
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-sm text-muted-foreground">{campaign.tenant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign._count.flyers} flyers · Created {new Date(campaign.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{campaign.status}</Badge>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(campaign.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
