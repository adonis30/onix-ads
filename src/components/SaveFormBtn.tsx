'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { HiSaveAs } from 'react-icons/hi';
import { useFormBuilder } from '@/context/FormBuilderContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function SaveFormBtn() {
  const { elements, headerElements, footerElements, form } = useFormBuilder();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    try {
      setLoading(true);

      // Combine all elements
      const allElements = [...headerElements, ...elements, ...footerElements];

      const response = await fetch(`/api/tenants/forms/${form.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: allElements,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save form');
      }

      toast.success('Form saved successfully!');
      router.refresh();
    } catch (error) {
      console.error('Save form error:', error);
      toast.error('Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      className="gap-2"
      onClick={handleSave}
      disabled={loading}
    >
      <HiSaveAs className="h-6 w-6 mr-2" />
      {loading ? 'Saving...' : 'Save Form'}
    </Button>
  );
}

export default SaveFormBtn;
