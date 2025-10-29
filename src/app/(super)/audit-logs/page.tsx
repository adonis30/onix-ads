'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterTenantId, setFilterTenantId] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, filterTenantId, filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '50',
    });
    if (filterTenantId) params.append('tenantId', filterTenantId);
    if (filterAction) params.append('action', filterAction);

    const res = await fetch(`/api/super/audit-logs?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setTotalPages(data.pagination?.pages || 1);
    setLoading(false);
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800';
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Audit Logs</h1>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Tenant ID"
              value={filterTenantId}
              onChange={(e) => {
                setFilterTenantId(e.target.value);
                setPage(1);
              }}
            />
            <Select
              value={filterAction || 'ALL'}
              onValueChange={(value) => {
                setFilterAction(value === 'ALL' ? '' : value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All actions</SelectItem>
                <SelectItem value="USER_INVITE">User Invite</SelectItem>
                <SelectItem value="TENANT_SETTINGS_UPDATE">Settings Update</SelectItem>
                <SelectItem value="TENANT_SUBSCRIPTION_UPDATE">Subscription Update</SelectItem>
                <SelectItem value="SUPER_TENANT_UPDATE">Super Tenant Update</SelectItem>
                <SelectItem value="CAMPAIGN_CREATE">Campaign Create</SelectItem>
                <SelectItem value="FLYER_CREATE">Flyer Create</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFilterTenantId('');
                setFilterAction('');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border p-4 rounded space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">Tenant:</span> {log.tenant?.name || 'N/A'}
                    </p>
                    {log.user && (
                      <p className="text-sm">
                        <span className="font-medium">User:</span> {log.user.name || log.user.email}
                      </p>
                    )}
                  </div>
                </div>

                {log.metadata && (
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
