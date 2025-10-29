import React from "react";
import { MdLock } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "PasswordField";

export const PasswordFieldFormElement: FormElement = {
  type,
  construct: (id) => ({ id, type, extraAttributes: { label: "Password", placeholder: "Enter password" } }),
  designerBtnElement: { icon: MdLock, label: "Password" },
  designerComponent: ({ elementInstance }) => {
    const a = elementInstance.extraAttributes!;
    return (
      <div>
        <label>{a.label}</label>
        <input disabled type="password" placeholder={a.placeholder} className="border rounded w-full p-2 mt-1" />
      </div>
    );
  },
  formComponent: ({ elementInstance }) => {
    const a = elementInstance.extraAttributes!;
    return (
      <div>
        <label>{a.label}</label>
        <input type="password" placeholder={a.placeholder} className="border rounded w-full p-2 mt-1" />
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
      <div>
        <label>
          Label
          <input value={a.label} onChange={(e) => set("label", e.target.value)} className="border rounded p-1 w-full" />
        </label>
      </div>
    );
  },
};
