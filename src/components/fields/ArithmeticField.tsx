'use client';
import React, { useEffect, useState } from 'react';
import { MdFunctions } from 'react-icons/md';
import { ElementsType, FormElement, FormElementInstance } from '../FormElements';
import { Parser } from 'expr-eval';

const type: ElementsType = 'ArithmeticField';

type ArithmeticFieldType = 'normal' | 'subtotal' | 'grand_total' | 'tax' | 'discount';

export const ArithmeticFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: {
      label: 'Calculated Field',
      fieldType: 'normal' as ArithmeticFieldType,
      formula: 'price * quantity',
      decimalPlaces: 2,
      dependencies: ['price', 'quantity'],
      helperText: 'Automatically calculated field',
    },
  }),

  designerBtnElement: {
    icon: MdFunctions,
    label: 'Arithmetic',
  },

  designerComponent: ({ elementInstance }: { elementInstance: FormElementInstance }) => {
    const { label, formula, fieldType } = elementInstance.extraAttributes ?? {};
    return (
      <div className="border rounded-xl p-3 w-full bg-gray-50 dark:bg-gray-800 shadow-sm">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold">{label ?? 'Calculated Field'}</label>
          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
            {fieldType?.replace('_', ' ') ?? 'normal'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 font-mono">{formula ?? '—'}</p>
      </div>
    );
  },

  formComponent: ({
    elementInstance,
    formValues = {},
  }: {
    elementInstance: FormElementInstance;
    formValues?: Record<string, any>;
  }) => {
    const attrs = elementInstance.extraAttributes ?? {};
    const { label, formula, decimalPlaces, fieldType } = attrs;
    const [value, setValue] = useState<number>(0);

    useEffect(() => {
      try {
        let result = 0;
        const parser = new Parser();

        // ✅ Different computation strategies by field type
        switch (fieldType) {
          case 'subtotal':
            // Sum all numeric fields whose keys start with "item_"
            result = Object.entries(formValues)
              .filter(([key, val]) => key.startsWith('item_') && typeof val === 'number')
              .reduce((acc, [, val]) => acc + (val as number), 0);
            break;

          case 'grand_total':
            // Sum all subtotal fields
            result = Object.entries(formValues)
              .filter(([key]) => key.includes('subtotal'))
              .reduce((acc, [, val]) => acc + (val as number), 0);
            break;

          case 'tax':
            // Example: tax = subtotal * 0.16
            const sub = Object.entries(formValues)
              .filter(([key]) => key.includes('subtotal'))
              .reduce((acc, [, val]) => acc + (val as number), 0);
            result = sub * 0.16;
            break;

          case 'discount':
            // Example: discount = subtotal * 0.10
            const subtotal = Object.entries(formValues)
              .filter(([key]) => key.includes('subtotal'))
              .reduce((acc, [, val]) => acc + (val as number), 0);
            result = subtotal * 0.1;
            break;

          default:
            // Evaluate a custom formula
            const expr = parser.parse(formula || '0');
            result = expr.evaluate(formValues ?? {});
        }

        setValue(Number(result.toFixed(decimalPlaces ?? 2)));
      } catch {
        setValue(0);
      }
    }, [formValues, formula, decimalPlaces, fieldType]);

    return (
      <div className="flex flex-col gap-1 w-full">
        <label className="text-sm font-medium">{label ?? 'Calculated Field'}</label>
        <input
          readOnly
          value={isNaN(value) ? '' : value}
          className="border p-2 rounded w-full bg-gray-100 dark:bg-gray-900 text-right font-mono"
        />
      </div>
    );
  },

  propertiesComponent: ({
    elementInstance,
    setElements,
  }: {
    elementInstance: FormElementInstance;
    setElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
  }) => {
    const attrs = elementInstance.extraAttributes ?? {};

    const update = (key: string, value: any) =>
      setElements((prev) =>
        prev.map((el) =>
          el.id === elementInstance.id
            ? { ...el, extraAttributes: { ...attrs, [key]: value } }
            : el
        )
      );

    return (
      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium">
          Label
          <input
            value={attrs.label ?? ''}
            onChange={(e) => update('label', e.target.value)}
            className="border rounded p-1 w-full"
          />
        </label>

        <label className="text-sm font-medium">
          Field Type
          <select
            value={attrs.fieldType ?? 'normal'}
            onChange={(e) => update('fieldType', e.target.value)}
            className="border rounded p-1 w-full"
          >
            <option value="normal">Normal</option>
            <option value="subtotal">Subtotal</option>
            <option value="tax">Tax (16%)</option>
            <option value="discount">Discount (10%)</option>
            <option value="grand_total">Grand Total</option>
          </select>
        </label>

        {attrs.fieldType === 'normal' && (
          <>
            <label className="text-sm font-medium">
              Formula
              <textarea
                value={attrs.formula ?? ''}
                onChange={(e) => update('formula', e.target.value)}
                className="border rounded p-1 w-full font-mono text-sm"
                placeholder="e.g. price * quantity"
              />
            </label>
            <label className="text-sm font-medium">
              Dependencies (comma-separated)
              <input
                value={Array.isArray(attrs.dependencies) ? attrs.dependencies.join(', ') : ''}
                onChange={(e) =>
                  update(
                    'dependencies',
                    e.target.value.split(',').map((s) => s.trim())
                  )
                }
                className="border rounded p-1 w-full"
                placeholder="price, quantity"
              />
            </label>
          </>
        )}

        <label className="text-sm font-medium">
          Decimal Places
          <input
            type="number"
            min={0}
            max={6}
            value={attrs.decimalPlaces ?? 2}
            onChange={(e) => update('decimalPlaces', +e.target.value)}
            className="border rounded p-1 w-full"
          />
        </label>
      </div>
    );
  },
};
