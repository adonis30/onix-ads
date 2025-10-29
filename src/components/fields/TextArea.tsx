import { FaRegFileLines } from "react-icons/fa6";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "TextArea";

export const TextAreaFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: {
      label: "Paragraph",
      placeholder: "Type something...",
      rows: 4,
    },
  }),
  designerBtnElement: {
    icon: FaRegFileLines,
    label: "Text Area",
  },
  designerComponent: () => (
    <div className="flex flex-col gap-1">
      <label className="font-medium">Text Area</label>
      <textarea className="border rounded p-2 w-full" rows={4}></textarea>
    </div>
  ),
  formComponent: () => <textarea className="border rounded p-2 w-full" rows={4}></textarea>,
  propertiesComponent: () => <div>Text Area Properties</div>,
};
