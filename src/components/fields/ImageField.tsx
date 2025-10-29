import React from "react";
import { MdImage } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "ImageField";

export const ImageFieldFormElement: FormElement = {
  type,
  construct: (id) => ({
    id,
    type,
    extraAttributes: { src: "/placeholder.png", alt: "Image" },
  }),
  designerBtnElement: { icon: MdImage, label: "Image" },
  designerComponent: ({ elementInstance }) => {
    const { src, alt } = elementInstance.extraAttributes!;
    return <img src={src} alt={alt} className="w-full rounded-md" />;
  },
  formComponent: ({ elementInstance }) => {
    const { src, alt } = elementInstance.extraAttributes!;
    return <img src={src} alt={alt} className="w-full rounded-md" />;
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
          Image URL
          <input value={attrs.src} onChange={(e) => set("src", e.target.value)} className="border rounded px-2 py-1 w-full" />
        </label>
        <label>
          Alt Text
          <input value={attrs.alt} onChange={(e) => set("alt", e.target.value)} className="border rounded px-2 py-1 w-full" />
        </label>
      </div>
    );
  },
};
