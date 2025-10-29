import React from "react";
import { MdTune } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "SliderField";

export const SliderFieldFormElement: FormElement = {
  type,
  construct: (id) => ({ id, type, extraAttributes: { label: "Select value", min: 0, max: 100 } }),
  designerBtnElement: { icon: MdTune, label: "Slider" },
  designerComponent: ({ elementInstance }) => {
    const a = elementInstance.extraAttributes!;
    return (
      <div>
        <label>{a.label}</label>
        <input disabled type="range" min={a.min} max={a.max} className="w-full mt-1" />
      </div>
    );
  },
  formComponent: ({ elementInstance }) => {
    const a = elementInstance.extraAttributes!;
    return (
      <div>
        <label>{a.label}</label>
        <input type="range" min={a.min} max={a.max} className="w-full mt-1" />
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
      <div className="grid grid-cols-2 gap-2">
        <label>
          Min
          <input type="number" value={a.min} onChange={(e) => set("min", +e.target.value)} className="border rounded p-1 w-full" />
        </label>
        <label>
          Max
          <input type="number" value={a.max} onChange={(e) => set("max", +e.target.value)} className="border rounded p-1 w-full" />
        </label>
      </div>
    );
  },
};
