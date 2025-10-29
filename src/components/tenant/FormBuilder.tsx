'use client';

import { DynamicForm } from '@prisma/client';
import React from 'react';
import PreviewDialogBtn from '../PreviewDialogBtn';
import SaveFormBtn from '../SaveFormBtn';
import PublishFormBtn from '../PublishFormBtn';
import Designer from '../Designer';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FormBuilderProvider } from '@/context/FormBuilderContext';
import { FormElementInstance } from '../FormElements';

function FormBuilder({ form }: { form: DynamicForm & { published?: boolean } }) {
  // Parse existing form fields from database
  const parseFormData = () => {
    try {
      const fields = Array.isArray(form.fields) ? form.fields : JSON.parse(form.fields as any);
      
      // Extract header, footer, and main elements
      const headerElements = fields.filter((f: any) => f.type === 'HeaderField') as FormElementInstance[];
      const footerElements = fields.filter((f: any) => f.type === 'FooterField') as FormElementInstance[];
      const mainElements = fields.filter(
        (f: any) => f.type !== 'HeaderField' && f.type !== 'FooterField'
      ) as FormElementInstance[];
      
      return { headerElements, footerElements, mainElements };
    } catch (error) {
      console.error('Failed to parse form fields:', error);
      return { headerElements: [], footerElements: [], mainElements: [] };
    }
  };

  const { headerElements, footerElements, mainElements } = parseFormData();

  return (
    <DndProvider backend={HTML5Backend}>
      <FormBuilderProvider
        form={form}
        initialElements={mainElements}
        initialHeader={headerElements}
        initialFooter={footerElements}
      >
        <main className="flex flex-col w-full h-full min-h-screen">
          <nav className="flex justify-between border-b p-4 gap-3 items-center bg-background">
            <h1 className="truncate font-medium">
              <span className="text-muted-foreground mr-2">Form:</span>
              {form.name}
            </h1>
            <div className="flex items-center gap-2">
              <PreviewDialogBtn />
              {!form.published && (
                <>
                  <SaveFormBtn />
                  <PublishFormBtn />
                </>
              )}
            </div>
          </nav>

          <div className="flex w-full flex-1 items-center justify-center relative overflow-y-auto bg-accent bg-[url('/paper.svg')] dark:bg-[url('/paper-dark.svg')] bg-cover bg-center">
            <Designer />
          </div>
        </main>
      </FormBuilderProvider>
    </DndProvider>
  );
}

export default FormBuilder;
