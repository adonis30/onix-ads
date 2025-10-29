import React from "react";
import { MdHorizontalRule } from "react-icons/md";
import { ElementsType, FormElement } from "../FormElements";

const type: ElementsType = "SeparatorField";

export const SeparatorFieldFormElement: FormElement = {
  type,
  construct: (id) => ({ id, type }),
  designerBtnElement: { icon: MdHorizontalRule, label: "Separator" },
  designerComponent: () => <hr className="border-t border-gray-300 my-4 w-full" />,
  formComponent: () => <hr className="border-t border-gray-300 my-4 w-full" />,
  propertiesComponent: () => <p className="text-sm text-gray-500">No properties.</p>,
};
