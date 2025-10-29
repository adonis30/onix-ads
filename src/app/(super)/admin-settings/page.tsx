'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Mail, Database, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [systemSettings, setSystemSettings] = useState({
    platformName: 'Onix Ads Platform',
    supportEmail: 'support@onixads.com',
    maxTenants: 100,
  });

  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    fromEmail: 'noreply@onixads.com',
  });

  const [storageSettings, setStorageSettings] = useState({
    maxUploadSize: 10,
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    passwordMinLength: 8,
    require2FA: false,
  });

  const handleSaveSystem = () => {
    // In production, this would call an API
    toast.success('System settings saved successfully');
  };

  const handleSaveEmail = () => {
    toast.success('Email settings saved successfully');
  };

  const handleSaveStorage = () => {
    toast.success('Storage settings saved successfully');
  };

  const handleSaveSecurity = () => {
    toast.success('Security settings saved successfully');
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Platform Settings</h1>
      <p className="text-muted-foreground">
        Configure platform-wide settings and preferences
      </p>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <CardTitle>System Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Platform Name</Label>
            <Input 
              value={systemSettings.platformName} 
              onChange={(e) => setSystemSettings({ ...systemSettings, platformName: e.target.value })}
            />
          </div>
          <div>
            <Label>Support Email</Label>
            <Input 
              type="email" 
              value={systemSettings.supportEmail}
              onChange={(e) => setSystemSettings({ ...systemSettings, supportEmail: e.target.value })}
            />
          </div>
          <div>
            <Label>Max Tenants</Label>
            <Input 
              type="number" 
              value={systemSettings.maxTenants}
              onChange={(e) => setSystemSettings({ ...systemSettings, maxTenants: parseInt(e.target.value) })}
            />
          </div>
          <Button onClick={handleSaveSystem}>Save System Settings</Button>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Configuration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>SMTP Host</Label>
            <Input 
              value={emailSettings.smtpHost}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
            />
          </div>
          <div>
            <Label>SMTP Port</Label>
            <Input 
              type="number" 
              value={emailSettings.smtpPort}
              onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>From Email</Label>
            <Input 
              type="email" 
              value={emailSettings.fromEmail}
              onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
            />
          </div>
          <Button onClick={handleSaveEmail}>Save Email Settings</Button>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Database & Storage</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Database Status</Label>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Connected</span>
            </div>
          </div>
          <div>
            <Label>Storage Provider</Label>
            <Input defaultValue="AWS S3" disabled />
          </div>
          <div>
            <Label>Max Upload Size (MB)</Label>
            <Input 
              type="number" 
              value={storageSettings.maxUploadSize}
              onChange={(e) => setStorageSettings({ ...storageSettings, maxUploadSize: parseInt(e.target.value) })}
            />
          </div>
          <Button onClick={handleSaveStorage}>Save Storage Settings</Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Session Timeout (minutes)</Label>
            <Input 
              type="number" 
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Password Min Length</Label>
            <Input 
              type="number" 
              value={securitySettings.passwordMinLength}
              onChange={(e) => setSecuritySettings({ ...securitySettings, passwordMinLength: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label>Enable 2FA</Label>
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="checkbox" 
                className="h-4 w-4" 
                checked={securitySettings.require2FA}
                onChange={(e) => setSecuritySettings({ ...securitySettings, require2FA: e.target.checked })}
              />
              <span className="text-sm">Require 2FA for all admins</span>
            </div>
          </div>
          <Button onClick={handleSaveSecurity}>Save Security Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
