import { MdArrowDropDownCircle } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "SelectField";

export const SelectFieldFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: {
      label: "Dropdown",
      options: ["Option A", "Option B", "Option C"],
    },
  }),
  designerBtnElement: {
    icon: MdArrowDropDownCircle,
    label: "Select Field",
  },
  designerComponent: () => (
    <div className="flex flex-col gap-1">
      <label className="font-medium">Dropdown</label>
      <select className="border rounded p-2">
        <option>Option A</option>
        <option>Option B</option>
        <option>Option C</option>
      </select>
    </div>
  ),
  formComponent: () => (
    <select className="border rounded p-2 w-full">
      <option>Option A</option>
      <option>Option B</option>
      <option>Option C</option>
    </select>
  ),
  propertiesComponent: () => <div>Select Field Properties</div>,
};
