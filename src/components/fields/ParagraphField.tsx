import React from "react";
import { MdNotes } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "ParagraphField";

export const ParagraphFieldFormElement: FormElement = {
  type,
  construct: (id) => ({
    id,
    type,
    extraAttributes: { text: "This is a paragraph or instruction text." },
  }),
  designerBtnElement: { icon: MdNotes, label: "Paragraph" },
  designerComponent: ({ elementInstance }) => (
    <p className="text-sm text-gray-500 italic">{elementInstance.extraAttributes!.text}</p>
  ),
  formComponent: ({ elementInstance }) => (
    <p className="text-sm text-gray-600 italic">{elementInstance.extraAttributes!.text}</p>
  ),
  propertiesComponent: ({ elementInstance, setElements }) => {
    const attrs = elementInstance.extraAttributes!;
    const set = (k: string, v: any) =>
      setElements((p) =>
        p.map((el) => (el.id === elementInstance.id ? { ...el, extraAttributes: { ...attrs, [k]: v } } : el))
      );
    return (
      <div>
        <label>
          Text
          <textarea
            value={attrs.text}
            onChange={(e) => set("text", e.target.value)}
            className="border rounded w-full p-1"
          />
        </label>
      </div>
    );
  },
};
