import { BsCalendarDate } from "react-icons/bs";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "DatePicker";

export const DatePickerFormElement: FormElement = {
  type,
  construct: (id: string) => ({
    id,
    type,
    extraAttributes: {
      label: "Date Picker",
    },
  }),
  designerBtnElement: {
    icon: BsCalendarDate,
    label: "Date Picker",
  },
  designerComponent: () => (
    <div className="flex flex-col gap-1">
      <label className="font-medium">Date Picker</label>
      <input type="date" className="border rounded p-2 w-full" />
    </div>
  ),
  formComponent: () => <input type="date" className="border rounded p-2 w-full" />,
  propertiesComponent: () => <div>Date Picker Properties</div>,
};
