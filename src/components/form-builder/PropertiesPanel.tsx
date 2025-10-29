// src/components/form-builder/PropertiesPanel.tsx
'use client';

import { useFormBuilder } from '@/lib/form-builder/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Palette, Code } from 'lucide-react';

export function PropertiesPanel() {
  const { schema, selectedField, updateField } = useFormBuilder();

  const field = selectedField 
    ? schema.fields.find(f => f.id === selectedField)
    : null;

  if (!field) {
    return (
      <div className="w-80 border-l bg-background p-6">
        <div className="text-center text-muted-foreground">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No field selected</p>
          <p className="text-sm mt-1">Click on a field to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleUpdate = (key: string, value: any) => {
    updateField(selectedField!, { [key]: value });
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Properties</h2>
        <p className="text-sm text-muted-foreground">
          {field.type && 'type' in field ? field.type : 'Layout'}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="w-full grid grid-cols-3 m-2">
            <TabsTrigger value="properties">
              <Settings className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="style">
              <Palette className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Code className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="p-4 space-y-4">
            {/* Label */}
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={field.label || ''}
                onChange={(e) => handleUpdate('label', e.target.value)}
                placeholder="Field label"
              />
            </div>

            {/* Placeholder (for input fields) */}
            {'placeholder' in field && (
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={(field as any).placeholder || ''}
                  onChange={(e) => handleUpdate('placeholder', e.target.value)}
                  placeholder="Placeholder text"
                />
              </div>
            )}

            {/* Description */}
            {('description' in field) && (
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={(field as any).description || ''}
                  onChange={(e) => handleUpdate('description', e.target.value)}
                  placeholder="Help text"
                  rows={2}
                />
              </div>
            )}

            {/* Required */}
            {('required' in field) && (
              <div className="flex items-center justify-between">
                <Label>Required</Label>
                <Switch
                  checked={(field as any).required || false}
                  onCheckedChange={(checked) => handleUpdate('required', checked)}
                />
              </div>
            )}

            {/* Disabled */}
            {('disabled' in field) && (
              <div className="flex items-center justify-between">
                <Label>Disabled</Label>
                <Switch
                  checked={(field as any).disabled || false}
                  onCheckedChange={(checked) => handleUpdate('disabled', checked)}
                />
              </div>
            )}

            {/* Read Only */}
            {('readOnly' in field) && (
              <div className="flex items-center justify-between">
                <Label>Read Only</Label>
                <Switch
                  checked={(field as any).readOnly || false}
                  onCheckedChange={(checked) => handleUpdate('readOnly', checked)}
                />
              </div>
            )}

            {/* Min/Max Length (for text fields) */}
            {'minLength' in field && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Length</Label>
                  <Input
                    type="number"
                    value={(field as any).minLength || ''}
                    onChange={(e) => handleUpdate('minLength', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Length</Label>
                  <Input
                    type="number"
                    value={(field as any).maxLength || ''}
                    onChange={(e) => handleUpdate('maxLength', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Min/Max (for number fields) */}
            {'min' in field && 'max' in field && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum</Label>
                  <Input
                    type="number"
                    value={(field as any).min || ''}
                    onChange={(e) => handleUpdate('min', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum</Label>
                  <Input
                    type="number"
                    value={(field as any).max || ''}
                    onChange={(e) => handleUpdate('max', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Options (for select, radio, checkbox) */}
            {'options' in field && (
              <div className="space-y-2">
                <Label>Options</Label>
                <Textarea
                  value={JSON.stringify((field as any).options, null, 2)}
                  onChange={(e) => {
                    try {
                      const options = JSON.parse(e.target.value);
                      handleUpdate('options', options);
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Format: [{`{ "label": "Option 1", "value": "opt1" }`}]
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="style" className="p-4 space-y-4">
            {/* Width */}
            <div className="space-y-2">
              <Label>Width</Label>
              <select
                value={(field as any).width || 'full'}
                onChange={(e) => handleUpdate('width', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="full">Full Width</option>
                <option value="half">Half Width</option>
                <option value="third">One Third</option>
                <option value="quarter">One Quarter</option>
              </select>
            </div>

            {/* Custom CSS Class */}
            <div className="space-y-2">
              <Label>CSS Class</Label>
              <Input
                value={(field as any).className || ''}
                onChange={(e) => handleUpdate('className', e.target.value)}
                placeholder="custom-class"
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Field ID</Label>
              <Input value={field.id} disabled className="font-mono text-xs" />
            </div>

            <div className="space-y-2">
              <Label>Field Type</Label>
              <Input
                value={(field as any).type || 'layout'}
                disabled
                className="font-mono text-xs"
              />
            </div>

            <Button variant="outline" className="w-full" size="sm">
              Add Validation Rules
            </Button>

            <Button variant="outline" className="w-full" size="sm">
              Add Conditional Logic
            </Button>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
}
