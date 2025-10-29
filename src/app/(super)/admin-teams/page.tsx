'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminTeamsPage() {
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMemberships();
  }, [page]);

  const fetchMemberships = async () => {
    setLoading(true);
    const res = await fetch(`/api/super/memberships?page=${page}&limit=50`);
    const data = await res.json();
    setMemberships(data.memberships || []);
    setTotalPages(data.pagination?.pages || 1);
    setLoading(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'TENANT_ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'EDITOR':
        return 'bg-green-100 text-green-800';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">All Team Memberships</h1>

      <Card>
        <CardHeader>
          <CardTitle>Platform Memberships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {memberships.map((membership) => (
              <div key={membership.id} className="flex justify-between items-center border p-4 rounded">
                <div className="flex-1">
                  <p className="font-medium">{membership.user.name || membership.user.email}</p>
                  <p className="text-sm text-muted-foreground">{membership.tenant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {new Date(membership.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getRoleColor(membership.role)}>{membership.role}</Badge>
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
