'use client';

import React from 'react';
import {
  ElementsType,
  FormElement,
  FormElementInstance,
} from '../FormElements';
import { MdSmartButton } from 'react-icons/md';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const type: ElementsType = 'ButtonField';

type ButtonAction = 
  | 'save'
  | 'delete'
  | 'execute'
  | 'add'
  | 'multiply'
  | 'subtract'
  | 'divide'
  | 'navigate'
  | 'reset'
  | 'submit'
  | 'custom';

export const ButtonFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: {
      label: 'Click Me',
      action: 'submit' as ButtonAction,
      variant: 'default',
      size: 'default',
      fullWidth: false,
      disabled: false,
      customCode: '',
      navigateUrl: '',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
    },
  }),

  designerBtnElement: {
    icon: MdSmartButton,
    label: 'Button',
  },

  designerComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes ?? {
      label: 'Click Me',
      variant: 'default',
    };

    return (
      <div className="w-full flex items-center justify-center p-4">
        <Button
          type="button"
          style={{
            backgroundColor: attrs.backgroundColor || '#3b82f6',
            color: attrs.textColor || '#ffffff',
            width: attrs.fullWidth ? '100%' : 'auto',
          }}
          disabled={attrs.disabled}
          className="font-medium"
        >
          {attrs.label}
        </Button>
      </div>
    );
  },

  formComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes ?? {
      label: 'Click Me',
      action: 'submit',
    };

    const handleClick = () => {
      switch (attrs.action) {
        case 'save':
          console.log('Save action triggered');
          // Implement save logic
          break;
        case 'delete':
          console.log('Delete action triggered');
          // Implement delete logic
          break;
        case 'execute':
          console.log('Execute action triggered');
          // Implement execute logic
          break;
        case 'add':
          console.log('Add action triggered');
          // Implement add logic
          break;
        case 'multiply':
          console.log('Multiply action triggered');
          // Implement multiply logic
          break;
        case 'subtract':
          console.log('Subtract action triggered');
          break;
        case 'divide':
          console.log('Divide action triggered');
          break;
        case 'navigate':
          if (attrs.navigateUrl) {
            window.location.href = attrs.navigateUrl;
          }
          break;
        case 'reset':
          console.log('Reset form');
          break;
        case 'submit':
          console.log('Submit form');
          break;
        case 'custom':
          try {
            if (attrs.customCode) {
              // eslint-disable-next-line no-eval
              eval(attrs.customCode);
            }
          } catch (error) {
            console.error('Custom code error:', error);
          }
          break;
        default:
          console.log('Button clicked');
      }
    };

    return (
      <div className="w-full flex items-center justify-center">
        <Button
          type={attrs.action === 'submit' ? 'submit' : 'button'}
          onClick={attrs.action !== 'submit' ? handleClick : undefined}
          style={{
            backgroundColor: attrs.backgroundColor || '#3b82f6',
            color: attrs.textColor || '#ffffff',
            width: attrs.fullWidth ? '100%' : 'auto',
          }}
          disabled={attrs.disabled}
        >
          {attrs.label}
        </Button>
      </div>
    );
  },

  propertiesComponent: ButtonFieldPropertiesComponent,
};

function ButtonFieldPropertiesComponent({
  elementInstance,
  setElements,
}: {
  elementInstance: FormElementInstance;
  setElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
}) {
    const attrs = elementInstance.extraAttributes ?? {
      label: 'Click Me',
      action: 'submit',
      variant: 'default',
      size: 'default',
      fullWidth: false,
      disabled: false,
      customCode: '',
      navigateUrl: '',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
    };

    const update = (key: string, value: any) =>
      setElements((prev) =>
        prev.map((el) =>
          el.id === elementInstance.id
            ? { ...el, extraAttributes: { ...attrs, [key]: value } }
            : el
        )
      );

    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Button Label</Label>
          <Input
            value={attrs.label}
            onChange={(e) => update('label', e.target.value)}
            placeholder="Click Me"
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">Action</Label>
          <select
            value={attrs.action}
            onChange={(e) => update('action', e.target.value)}
            className="w-full border rounded-md p-2 bg-background text-foreground"
          >
            <option value="submit">Submit Form</option>
            <option value="save">Save Data</option>
            <option value="delete">Delete</option>
            <option value="reset">Reset Form</option>
            <option value="execute">Execute</option>
            <option value="add">Add/Calculate</option>
            <option value="multiply">Multiply</option>
            <option value="subtract">Subtract</option>
            <option value="divide">Divide</option>
            <option value="navigate">Navigate to URL</option>
            <option value="custom">Custom Code</option>
          </select>
        </div>

        {attrs.action === 'navigate' && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Navigate URL</Label>
            <Input
              value={attrs.navigateUrl}
              onChange={(e) => update('navigateUrl', e.target.value)}
              placeholder="https://example.com"
              className="bg-background"
            />
          </div>
        )}

        {attrs.action === 'custom' && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Custom JavaScript</Label>
            <textarea
              value={attrs.customCode}
              onChange={(e) => update('customCode', e.target.value)}
              placeholder="console.log('Hello');"
              rows={4}
              className="w-full border rounded-md p-2 bg-background text-foreground font-mono text-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Background Color</Label>
            <Input
              type="color"
              value={attrs.backgroundColor}
              onChange={(e) => update('backgroundColor', e.target.value)}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Text Color</Label>
            <Input
              type="color"
              value={attrs.textColor}
              onChange={(e) => update('textColor', e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={attrs.fullWidth}
              onChange={(e) => update('fullWidth', e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            Full Width
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={attrs.disabled}
              onChange={(e) => update('disabled', e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            Disabled
          </label>
        </div>
      </div>
    );
}
