'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    primaryColor: '',
    accentColor: '',
    logoUrl: '',
    domain: '',
  });
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  useEffect(() => {
    fetch('/api/tenants/settings')
      .then((res) => res.json())
      .then((tenant) => {
        setData(tenant);
        setFormData({
          primaryColor: tenant.primaryColor || '',
          accentColor: tenant.accentColor || '',
          logoUrl: tenant.logoUrl || '',
          domain: tenant.domain || '',
        });
        setApiKeys(tenant.apiKeys || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async () => {
    const res = await fetch('/api/tenants/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      toast.success('Settings updated successfully');
    } else {
      toast.error('Failed to update settings');
    }
  };

  const handleCreateApiKey = async () => {
    const res = await fetch('/api/tenants/settings/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName }),
    });
    if (res.ok) {
      const data = await res.json();
      setGeneratedKey(data.apiKey);
      setApiKeys([...apiKeys, { id: data.id, name: newKeyName, createdAt: new Date() }]);
      setNewKeyName('');
      toast.success('API Key created successfully. Copy it now!');
    } else {
      toast.error('Failed to create API key');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    const res = await fetch(`/api/tenants/settings/api-keys?id=${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setApiKeys(apiKeys.filter((k) => k.id !== id));
      toast.success('API Key deleted');
    } else {
      toast.error('Failed to delete API key');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Primary Color</Label>
            <Input
              type="color"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
            />
          </div>
          <div>
            <Label>Accent Color</Label>
            <Input
              type="color"
              value={formData.accentColor}
              onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
            />
          </div>
          <div>
            <Label>Logo URL</Label>
            <Input
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div>
            <Label>Custom Domain</Label>
            <Input
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              placeholder="mysite.com"
            />
          </div>
          <Button onClick={handleUpdate}>Save Settings</Button>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name"
            />
            <Button onClick={handleCreateApiKey}>Create Key</Button>
          </div>

          {generatedKey && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="font-medium mb-2">Your new API key (copy now!):</p>
              <code className="block bg-gray-100 p-2 rounded">{generatedKey}</code>
            </div>
          )}

          <div className="space-y-2">
            {apiKeys.map((key) => (
              <div key={key.id} className="flex justify-between items-center border p-3 rounded">
                <div>
                  <p className="font-medium">{key.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Created: {new Date(key.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteApiKey(key.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
