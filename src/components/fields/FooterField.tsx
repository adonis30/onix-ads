'use client';

import React from 'react';
import {
  ElementsType,
  FormElement,
  FormElementInstance,
} from '../FormElements';
import { MdSpaceBar } from 'react-icons/md';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const type: ElementsType = 'FooterField';

export const FooterFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: {
      text: '© 2025 Your Company. All rights reserved.',
      backgroundColor: '#f9fafb',
      textColor: '#6b7280',
      alignment: 'center',
    },
  }),

  designerBtnElement: {
    icon: MdSpaceBar,
    label: 'Footer',
  },

  designerComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes ?? {
      text: '© 2025 Your Company. All rights reserved.',
      alignment: 'center',
    };

    return (
      <div
        className="w-full p-6 rounded-lg border-2 border-dashed"
        style={{
          backgroundColor: attrs.backgroundColor || '#f9fafb',
          color: attrs.textColor || '#6b7280',
          textAlign: attrs.alignment || 'center',
        }}
      >
        <p className="text-sm">{attrs.text}</p>
      </div>
    );
  },

  formComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes ?? {
      text: '© 2025 Your Company. All rights reserved.',
      alignment: 'center',
    };

    return (
      <div
        className="w-full p-6 rounded-lg"
        style={{
          backgroundColor: attrs.backgroundColor || '#f9fafb',
          color: attrs.textColor || '#6b7280',
          textAlign: attrs.alignment || 'center',
        }}
      >
        <p className="text-sm">{attrs.text}</p>
      </div>
    );
  },

  propertiesComponent: FooterFieldPropertiesComponent,
};

function FooterFieldPropertiesComponent({
  elementInstance,
  setElements,
}: {
  elementInstance: FormElementInstance;
  setElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
}) {
    const attrs = elementInstance.extraAttributes ?? {
      text: '© 2025 Your Company. All rights reserved.',
      backgroundColor: '#f9fafb',
      textColor: '#6b7280',
      alignment: 'center',
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
          <Label>Footer Text</Label>
          <Textarea
            value={attrs.text}
            onChange={(e) => update('text', e.target.value)}
            placeholder="Footer text..."
            rows={3}
          />
        </div>

        <div>
          <Label>Text Alignment</Label>
          <select
            value={attrs.alignment}
            onChange={(e) => update('alignment', e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
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
