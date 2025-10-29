import React from "react";
import { MdViewHeadline } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "SectionField";

export const SectionFieldFormElement: FormElement = {
  type,
  construct: (id) => ({
    id,
    type,
    extraAttributes: { title: "Section Title", description: "Optional section description" },
  }),
  designerBtnElement: { icon: MdViewHeadline, label: "Section" },
  designerComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes!;
    return (
      <div className="w-full text-left py-3">
        <h3 className="text-lg font-semibold">{attrs.title}</h3>
        {attrs.description && <p className="text-sm text-muted-foreground">{attrs.description}</p>}
      </div>
    );
  },
  formComponent: ({ elementInstance }) => {
    const attrs = elementInstance.extraAttributes!;
    return (
      <div className="py-3">
        <h3 className="text-lg font-semibold">{attrs.title}</h3>
        {attrs.description && <p className="text-sm text-gray-500">{attrs.description}</p>}
      </div>
    );
  },
  propertiesComponent: ({ elementInstance, setElements }) => {
    const a = elementInstance.extraAttributes!;
    const set = (k: string, v: any) =>
      setElements((prev) =>
        prev.map((el) => (el.id === elementInstance.id ? { ...el, extraAttributes: { ...a, [k]: v } } : el))
      );
    return (
      <div className="flex flex-col gap-2">
        <label>
          Title
          <input value={a.title} onChange={(e) => set("title", e.target.value)} className="border rounded w-full p-1" />
        </label>
        <label>
          Description
          <textarea value={a.description} onChange={(e) => set("description", e.target.value)} className="border rounded w-full p-1" />
        </label>
      </div>
    );
  },
};
