import React from "react";
import { MdLabel } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "LabelField";

export const LabelFieldFormElement: FormElement = {
  type,
  construct: (id) => ({
    id,
    type,
    extraAttributes: { text: "Label Text", size: "md" },
  }),
  designerBtnElement: { icon: MdLabel, label: "Label" },
  designerComponent: ({ elementInstance }) => {
    const { text, size } = elementInstance.extraAttributes!;
    return <p className={`text-${size} font-semibold text-gray-700`}>{text}</p>;
  },
  formComponent: ({ elementInstance }) => {
    const { text, size } = elementInstance.extraAttributes!;
    return <p className={`text-${size} font-semibold`}>{text}</p>;
  },
  propertiesComponent: ({ elementInstance, setElements }) => {
    const attrs = elementInstance.extraAttributes!;
    const set = (k: string, v: any) =>
      setElements((prev) =>
        prev.map((el) => el.id === elementInstance.id ? { ...el, extraAttributes: { ...attrs, [k]: v } } : el)
      );

    return (
      <div className="flex flex-col gap-2">
        <label>
          Text
          <input
            value={attrs.text}
            onChange={(e) => set("text", e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </label>
        <label>
          Size
          <select
            value={attrs.size}
            onChange={(e) => set("size", e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </label>
      </div>
    );
  },
};
