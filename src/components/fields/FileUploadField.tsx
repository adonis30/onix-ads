import React from "react";
import { MdUploadFile } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "FileUpload";

export const FileUploadFormElement: FormElement = {
  type,
  construct: (id) => ({ id, type, extraAttributes: { label: "Upload File", multiple: false } }),
  designerBtnElement: { icon: MdUploadFile, label: "File Upload" },
  designerComponent: ({ elementInstance }) => {
    const { label } = elementInstance.extraAttributes!;
    return (
      <div>
        <label className="block text-sm font-medium">{label}</label>
        <input disabled type="file" className="w-full border rounded mt-1" />
      </div>
    );
  },
  formComponent: ({ elementInstance }) => {
    const { label, multiple } = elementInstance.extraAttributes!;
    return (
      <div>
        <label className="block">{label}</label>
        <input type="file" multiple={multiple} className="w-full border rounded mt-1" />
      </div>
    );
  },
  propertiesComponent: ({ elementInstance, setElements }) => {
    const a = elementInstance.extraAttributes!;
    const set = (k: string, v: any) =>
      setElements((prev) =>
        prev.map((el) => el.id === elementInstance.id ? { ...el, extraAttributes: { ...a, [k]: v } } : el)
      );
    return (
      <div className="flex flex-col gap-2">
        <label>
          Label
          <input value={a.label} onChange={(e) => set("label", e.target.value)} className="border rounded px-2 py-1 w-full" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={a.multiple} onChange={(e) => set("multiple", e.target.checked)} />
          Allow multiple files
        </label>
      </div>
    );
  },
};
