'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DragDropProvider } from '@/components/form-builder/DragDropProvider';
import { ComponentSidebar } from '@/components/form-builder/ComponentSidebar';
import { FormCanvas } from '@/components/form-builder/FormCanvas';
import { PropertiesPanel } from '@/components/form-builder/PropertiesPanel';
import { Button } from '@/components/ui/button';
import { Save, Eye, Undo, Redo, ArrowLeft } from 'lucide-react';
import { useFormBuilder } from '@/lib/form-builder/store';
import { toast } from 'sonner';

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  
  const { 
    schema, 
    isDirty, 
    isSaving, 
    historyIndex, 
    history,
    undo, 
    redo, 
    setIsSaving,
    setSchema,
    saveState 
  } = useFormBuilder();

  // Load form data if editing existing form
  useEffect(() => {
    if (formId !== 'new') {
      loadForm(formId);
    }
  }, [formId]);

  const loadForm = async (id: string) => {
    try {
      const res = await fetch(`/api/forms/${id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.schema) {
          setSchema(data.schema);
        }
      } else {
        toast.error('Failed to load form');
        router.push('/forms');
      }
    } catch (error) {
      toast.error('Error loading form');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = formId === 'new' ? '/api/forms' : `/api/forms/${formId}`;
      const method = formId === 'new' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Untitled Form',
          description: '',
          schema,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Form saved successfully');
        saveState();
        
        if (formId === 'new') {
          router.push(`/forms/builder/${data.id}`);
        }
      } else {
        toast.error('Failed to save form');
      }
    } catch (error) {
      toast.error('Error saving form');
    } finally {
      setIsSaving(false);
    }
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Toolbar */}
      <div className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/forms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="h-6 w-px bg-border" />

          <h1 className="font-semibold text-lg">Form Builder</h1>
          {isDirty && (
            <span className="text-xs text-muted-foreground">(Unsaved changes)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Preview coming soon')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Builder Area */}
      <div className="flex flex-1 overflow-hidden">
        <DragDropProvider>
          <ComponentSidebar />
          <FormCanvas />
          <PropertiesPanel />
        </DragDropProvider>
      </div>
    </div>
  );
}
