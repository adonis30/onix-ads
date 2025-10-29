'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { MdOutlinePublish } from 'react-icons/md';
import { useFormBuilder } from '@/context/FormBuilderContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

function PublishFormBtn() {
  const { elements, headerElements, footerElements, form } = useFormBuilder();
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();

  const handlePublish = async () => {
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
          published: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish form');
      }

      toast.success('Form published successfully!');
      router.push('/forms'); // Redirect to forms list
      router.refresh();
    } catch (error) {
      console.error('Publish form error:', error);
      toast.error('Failed to publish form');
    } finally {
      setLoading(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <Button
        className="gap-2 text-white bg-gradient-to-r from-indigo-400 to-cyan-400"
        onClick={() => setShowDialog(true)}
        disabled={loading}
      >
        <MdOutlinePublish className="h-6 w-6 mr-2" />
        Publish Form
      </Button>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ready to publish?</AlertDialogTitle>
            <AlertDialogDescription>
              Once published, this form will be available for submissions. You won't be able to
              edit it after publishing.
              <br />
              <br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={loading}>
              {loading ? 'Publishing...' : 'Publish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default PublishFormBtn;
