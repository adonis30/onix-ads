'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { MdPreview, MdClose } from 'react-icons/md';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useFormBuilder } from '@/context/FormBuilderContext';
import { FormElements } from './FormElements';

function PreviewDialogBtn() {
  const [open, setOpen] = useState(false);
  const { elements, headerElements, footerElements, form } = useFormBuilder();

  return (
    <>
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <MdPreview className="h-6 w-6 mr-2" />
        Preview Form
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Form Preview: {form.name}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
              >
                <MdClose className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="bg-background rounded-lg border p-6 space-y-6">
            {/* Header */}
            {headerElements.length > 0 && (
              <div>
                {headerElements.map((element) => {
                  const FormComp = FormElements[element.type].formComponent;
                  return <FormComp key={element.id} elementInstance={element} />;
                })}
              </div>
            )}

            {/* Main Content */}
            <div className="space-y-4">
              {elements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No form elements yet. Add elements in the designer to see preview.
                </p>
              ) : (
                elements.map((element) => {
                  const FormComp = FormElements[element.type].formComponent;
                  return <FormComp key={element.id} elementInstance={element} />;
                })
              )}
            </div>

            {/* Footer */}
            {footerElements.length > 0 && (
              <div>
                {footerElements.map((element) => {
                  const FormComp = FormElements[element.type].formComponent;
                  return <FormComp key={element.id} elementInstance={element} />;
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PreviewDialogBtn;
