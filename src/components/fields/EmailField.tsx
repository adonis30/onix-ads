import React from "react";
import { MdEmail } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "EmailField";

export const EmailFieldFormElement: FormElement = {
  type,
  construct: (id) => ({ id, type, extraAttributes: { label: "Email Address", placeholder: "Enter your email" } }),
  designerBtnElement: { icon: MdEmail, label: "Email" },
  designerComponent: ({ elementInstance }) => {
    const a = elementInstance.extraAttributes!;
    return (
      <div>
        <label className="text-sm font-medium">{a.label}</label>
        <input disabled type="email" placeholder={a.placeholder} className="border rounded w-full p-2 mt-1" />
      </div>
    );
  },
  formComponent: ({ elementInstance }) => {
    const a = elementInstance.extraAttributes!;
    return (
      <div>
        <label className="text-sm font-medium">{a.label}</label>
        <input type="email" placeholder={a.placeholder} className="border rounded w-full p-2 mt-1" />
      </div>
    );
  },
  propertiesComponent: ({ elementInstance, setElements }) => {
    const a = elementInstance.extraAttributes!;
    const set = (k: string, v: any) =>
      setElements((p) =>
        p.map((el) => (el.id === elementInstance.id ? { ...el, extraAttributes: { ...a, [k]: v } } : el))
      );
    return (
      <div className="flex flex-col gap-2">
        <label>
          Label
          <input value={a.label} onChange={(e) => set("label", e.target.value)} className="border rounded p-1 w-full" />
        </label>
        <label>
          Placeholder
          <input value={a.placeholder} onChange={(e) => set("placeholder", e.target.value)} className="border rounded p-1 w-full" />
        </label>
      </div>
    );
  },
};
