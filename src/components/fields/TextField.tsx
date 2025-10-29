'use client';

import React from 'react';
import { MdTextFields } from "react-icons/md";
import { ElementsType, FormElement, FormElementInstance } from "../FormElements";

const type: ElementsType = "TextField";

export const TextFieldFormElement: FormElement = {
  type,
  construct: (id: string): FormElementInstance => ({
    id,
    type,
    extraAttributes: {
      label: "Text Field",
      placeholder: "Enter text here",
      required: false,
      helperText: "Helper text",
    },
  }),

  designerBtnElement: {
    icon: MdTextFields,
    label: "Text Field",
  },

  designerComponent: () => (
    <div className="w-full border border-dashed border-gray-500/40 p-3 rounded-md text-center text-gray-400">
      Text Field (dragged here)
    </div>
  ),

  formComponent: ({ elementInstance }: { elementInstance: FormElementInstance }) => {
    const attrs = elementInstance.extraAttributes ?? {}; // ✅ safe fallback
    return (
      <div className="flex flex-col w-full gap-1">
        <label className="text-sm font-medium text-gray-300">{attrs.label ?? "Text Field"}</label>
        <input
          type="text"
          placeholder={attrs.placeholder ?? ""}
          required={attrs.required ?? false}
          className="border border-gray-600 bg-gray-800 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        {attrs.helperText && (
          <small className="text-xs text-gray-500">{attrs.helperText}</small>
        )}
      </div>
    );
  },

  propertiesComponent: TextFieldPropertiesComponent,
};

function TextFieldPropertiesComponent({
  elementInstance,
  setElements,
}: {
  elementInstance: FormElementInstance;
  setElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
}) {
  const attrs = elementInstance.extraAttributes ?? {
    label: "",
    placeholder: "",
    helperText: "",
    required: false,
  };

  const handleChange = (key: string, value: any) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === elementInstance.id
          ? { ...el, extraAttributes: { ...el.extraAttributes, [key]: value } }
          : el
      )
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Label</label>
        <input
          type="text"
          value={attrs.label ?? ""}
          onChange={(e) => handleChange("label", e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter field label"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Placeholder</label>
        <input
          type="text"
          value={attrs.placeholder ?? ""}
          onChange={(e) => handleChange("placeholder", e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter placeholder text"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">Helper Text</label>
        <input
          type="text"
          value={attrs.helperText ?? ""}
          onChange={(e) => handleChange("helperText", e.target.value)}
          className="w-full border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add helpful information"
        />
        <p className="text-xs text-muted-foreground">Optional hint text shown below the field</p>
      </div>

      <div className="pt-2 border-t border-border">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={attrs.required ?? false}
            onChange={(e) => handleChange("required", e.target.checked)}
            className="w-4 h-4 accent-blue-500 cursor-pointer"
          />
          <span className="text-sm font-medium text-foreground group-hover:text-blue-500 transition-colors">Required field</span>
        </label>
        <p className="text-xs text-muted-foreground mt-1 ml-7">Users must fill this field before submitting</p>
      </div>
    </div>
  );
}
