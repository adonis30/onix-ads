'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tenants/billing')
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: string) => {
    await fetch('/api/tenants/billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    window.location.reload();
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Billing & Subscription</h1>

      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-4">{data?.currentPlan}</div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['FREE', 'STARTUP', 'PRO', 'ENTERPRISE'].map((plan) => (
              <Card key={plan} className={data?.currentPlan === plan ? 'border-blue-500' : ''}>
                <CardContent className="p-4">
                  <h3 className="font-bold mb-2">{plan}</h3>
                  <Button
                    onClick={() => handleUpgrade(plan)}
                    disabled={data?.currentPlan === plan}
                    className="w-full"
                  >
                    {data?.currentPlan === plan ? 'Current' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.paymentHistory?.map((payment: any) => (
              <div key={payment.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{payment.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {payment.currency} ${(payment.amount / 100).toFixed(2)}
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
