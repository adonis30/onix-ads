// src/app/(tenant)/billing/page.tsx
"use client";

import { useEffect, useState } from "react";

type Invoice = {
  id: string;
  subscriptionId: string;
  plan: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
};

export default function BillingPage({ params }: { params?: any }) {
  const tenantId = /* get tenant id via session or props */ (window as any).__TENANT_ID__ || "";

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    fetch(`/api/billing/invoices?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  async function cancel(subId: string) {
    if (!confirm("Cancel this subscription?")) return;
    await fetch("/api/billing/cancel", {
      method: "POST",
      body: JSON.stringify({ subscriptionId: subId, tenantId }),
      headers: { "Content-Type": "application/json" },
    });
    // refresh
    setLoading(true);
    const r = await fetch(`/api/billing/invoices?tenantId=${tenantId}`);
    setInvoices(await r.json());
    setLoading(false);
  }

  if (loading) return <div>Loading invoices…</div>;
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Billing & Invoices</h2>
      <div className="space-y-4">
        {invoices.length === 0 && <div>No invoices yet.</div>}
        {invoices.map((inv) => (
          <div key={inv.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <div className="font-medium">{inv.plan}</div>
              <div className="text-sm text-gray-500">Status: {inv.status}</div>
              <div className="text-sm text-gray-500">Date: {new Date(inv.createdAt).toLocaleString()}</div>
            </div>
            <div>
              {inv.status !== "CANCELED" && (
                <button onClick={() => cancel(inv.subscriptionId)} className="px-3 py-1 bg-red-600 text-white rounded">Cancel</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
