import React from "react";
import { MdStar } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "RatingField";

export const RatingFieldFormElement: FormElement = {
  type,
  construct: (id) => ({ id, type, extraAttributes: { label: "Rate this", max: 5 } }),
  designerBtnElement: { icon: MdStar, label: "Rating" },
  designerComponent: ({ elementInstance }) => {
    const { label, max } = elementInstance.extraAttributes!;
    return (
      <div>
        <label>{label}</label>
        <div className="flex gap-1 mt-1">
          {Array.from({ length: max }).map((_, i) => (
            <MdStar key={i} className="text-gray-300" />
          ))}
        </div>
      </div>
    );
  },
  formComponent: ({ elementInstance }) => {
    const { label, max } = elementInstance.extraAttributes!;
    return (
      <div>
        <label>{label}</label>
        <div className="flex gap-1 mt-1">
          {Array.from({ length: max }).map((_, i) => (
            <MdStar key={i} className="text-yellow-400" />
          ))}
        </div>
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
          Max Stars
          <input type="number" value={a.max} onChange={(e) => set("max", +e.target.value)} className="border rounded p-1 w-full" />
        </label>
      </div>
    );
  },
};
