import { BsCheckSquare } from "react-icons/bs";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "Checkbox";

export const CheckboxFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: { label: "Checkbox", checked: false },
  }),
  designerBtnElement: {
    icon: BsCheckSquare,
    label: "Checkbox",
  },
  designerComponent: () => (
    <label className="flex items-center gap-2">
      <input type="checkbox" /> Checkbox Option
    </label>
  ),
  formComponent: () => <input type="checkbox" />,
  propertiesComponent: () => <div>Checkbox Properties</div>,
};
