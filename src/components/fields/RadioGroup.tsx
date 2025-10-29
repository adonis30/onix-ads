import { BiRadioCircle } from "react-icons/bi";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "RadioGroup";

export const RadioGroupFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: {
      label: "Radio Group",
      options: ["Option 1", "Option 2"],
    },
  }),
  designerBtnElement: {
    icon: BiRadioCircle,
    label: "Radio Group",
  },
  designerComponent: () => (
    <div className="flex flex-col gap-1">
      <label className="font-medium">Radio Group</label>
      <div className="flex gap-3">
        <label><input type="radio" name="radio" /> Option 1</label>
        <label><input type="radio" name="radio" /> Option 2</label>
      </div>
    </div>
  ),
  formComponent: () => (
    <div className="flex flex-col gap-1">
      <label className="font-medium">Radio Group</label>
      <div className="flex gap-3">
        <label><input type="radio" /> Option 1</label>
        <label><input type="radio" /> Option 2</label>
      </div>
    </div>
  ),
  propertiesComponent: () => <div>Radio Group Properties</div>,
};
