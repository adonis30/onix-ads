'use client';

import React from 'react';
import {
  ElementsType,
  FormElement,
  FormElementInstance,
} from '../FormElements';
import { MdTitle } from 'react-icons/md';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

const type: ElementsType = 'HeaderField';

export const HeaderFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: {
      title: 'Form Header',
      subtitle: 'Fill out this form',
      backgroundColor: '#f9fafb',
      textColor: '#111827',
    },
  }),

  designerBtnElement: {
    icon: MdTitle,
    label: 'Header',
  },

  designerComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes ?? {
      title: 'Form Header',
      subtitle: 'Fill out this form',
    };

    return (
      <div
        className="w-full p-6 rounded-lg border-2 border-dashed"
        style={{
          backgroundColor: attrs.backgroundColor || '#f9fafb',
          color: attrs.textColor || '#111827',
        }}
      >
        <h1 className="text-3xl font-bold mb-2">{attrs.title}</h1>
        {attrs.subtitle && <p className="text-lg text-muted-foreground">{attrs.subtitle}</p>}
      </div>
    );
  },

  formComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes ?? {
      title: 'Form Header',
      subtitle: 'Fill out this form',
    };

    return (
      <div
        className="w-full p-6 rounded-lg"
        style={{
          backgroundColor: attrs.backgroundColor || '#f9fafb',
          color: attrs.textColor || '#111827',
        }}
      >
        <h1 className="text-3xl font-bold mb-2">{attrs.title}</h1>
        {attrs.subtitle && <p className="text-lg opacity-80">{attrs.subtitle}</p>}
      </div>
    );
  },

  propertiesComponent: HeaderFieldPropertiesComponent,
};

function HeaderFieldPropertiesComponent({
  elementInstance,
  setElements,
}: {
  elementInstance: FormElementInstance;
  setElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
}) {
    const attrs = elementInstance.extraAttributes ?? {
      title: 'Form Header',
      subtitle: 'Fill out this form',
      backgroundColor: '#f9fafb',
      textColor: '#111827',
    };

    const update = (key: string, value: string) =>
      setElements((prev) =>
        prev.map((el) =>
          el.id === elementInstance.id
            ? { ...el, extraAttributes: { ...attrs, [key]: value } }
            : el
        )
      );

    return (
      <div className="flex flex-col gap-4">
        <div>
          <Label>Title</Label>
          <Input
            value={attrs.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Form Header"
          />
        </div>

        <div>
          <Label>Subtitle</Label>
          <Input
            value={attrs.subtitle}
            onChange={(e) => update('subtitle', e.target.value)}
            placeholder="Fill out this form"
          />
        </div>

        <div>
          <Label>Background Color</Label>
          <Input
            type="color"
            value={attrs.backgroundColor}
            onChange={(e) => update('backgroundColor', e.target.value)}
          />
        </div>

        <div>
          <Label>Text Color</Label>
          <Input
            type="color"
            value={attrs.textColor}
            onChange={(e) => update('textColor', e.target.value)}
          />
        </div>
      </div>
    );
}
