import { LuHash } from "react-icons/lu";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "NumberField";

export const NumberFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: { label: "Number Field", placeholder: "Enter a number" },
  }),
  designerBtnElement: {
    icon: LuHash,
    label: "Number Field",
  },
  designerComponent: () => (
    <div className="flex flex-col gap-1">
      <label className="font-medium">Number Field</label>
      <input type="number" className="border rounded p-2 w-full" />
    </div>
  ),
  formComponent: () => <input type="number" className="border rounded p-2 w-full" />,
  propertiesComponent: () => <div>Number Field Properties</div>,
};
