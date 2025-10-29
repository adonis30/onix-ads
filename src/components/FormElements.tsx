// src/components/FormElements.tsx
import React from "react";
import { ArithmeticFieldFormElement } from "./fields/ArithmeticField";
import { CheckboxFormElement } from "./fields/Checkbox";
import { DatePickerFormElement } from "./fields/DatePicker";
import { EmailFieldFormElement } from "./fields/EmailField";
import { FileUploadFormElement } from "./fields/FileUploadField";
import { ImageFieldFormElement } from "./fields/ImageField";
import { LabelFieldFormElement } from "./fields/LabelField";
import { NumberFieldFormElement } from "./fields/NumberField";
import { ParagraphFieldFormElement } from "./fields/ParagraphField";
import { PasswordFieldFormElement } from "./fields/PasswordField";
import { RadioGroupFormElement } from "./fields/RadioGroup";
import { RatingFieldFormElement } from "./fields/RatingField";
import { SectionFieldFormElement } from "./fields/SectionField";
import { SelectFieldFormElement } from "./fields/SelectField";
import { SeparatorFieldFormElement } from "./fields/SeparatorField";
import { SliderFieldFormElement } from "./fields/SliderField";
import { TextAreaFormElement } from "./fields/TextArea";
import { TextFieldFormElement } from "./fields/TextField";
import { RowFieldFormElement } from "./fields/RowField";
import { ColumnFieldFormElement } from "./fields/ColumnField";
import { HeaderFieldFormElement } from "./fields/HeaderField";
import { FooterFieldFormElement } from "./fields/FooterField";
import { ButtonFieldFormElement } from "./fields/ButtonField";

/* ---------------------------------------------
   🔹 ELEMENT TYPE ENUM
---------------------------------------------- */
export type ElementsType =
  | "TextField"
  | "TextArea"
  | "NumberField"
  | "Checkbox"
  | "RadioGroup"
  | "SelectField"
  | "DatePicker"
  | "LabelField"
  | "SeparatorField"
  | "ImageField"
  | "FileUpload"
  | "EmailField"
  | "PasswordField"
  | "SliderField"
  | "RatingField"
  | "ArithmeticField"
  | "SectionField"
  | "ParagraphField"
  | "RowField"
  | "ColumnField"
  | "HeaderField"
  | "FooterField"
  | "ButtonField";

/* ---------------------------------------------
   🔹 BASE INSTANCE SHAPE (the “data” of an element)
---------------------------------------------- */
export type FormElementInstance = {
  id: string;
  type: ElementsType;
  extraAttributes?: Record<string, any>;
};

/* ---------------------------------------------
   🔹 FORM ELEMENT INTERFACE (extended for flexibility)
---------------------------------------------- */
export interface FormElement {
  type: ElementsType;

  construct: (id: string) => FormElementInstance;

  designerBtnElement: {
    icon: React.ElementType;
    label: string;
  };

  designerComponent: React.FC<{
    elementInstance: FormElementInstance;
    setElements?: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
  }>;

  formComponent: React.FC<{
    elementInstance: FormElementInstance;
    formValues?: Record<string, any>;
    setFormValues?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  }>;

  propertiesComponent: React.FC<{
    elementInstance: FormElementInstance;
    setElements: React.Dispatch<React.SetStateAction<FormElementInstance[]>>;
  }> | null;
}

/* ---------------------------------------------
   🔹 MAPPING OF ALL REGISTERED FORM ELEMENTS
---------------------------------------------- */
type FormElementsType = {
  [key in ElementsType]: FormElement;
};

export const FormElements: FormElementsType = {
  TextField: TextFieldFormElement,
  TextArea: TextAreaFormElement,
  NumberField: NumberFieldFormElement,
  Checkbox: CheckboxFormElement,
  RadioGroup: RadioGroupFormElement,
  SelectField: SelectFieldFormElement,
  DatePicker: DatePickerFormElement,
  LabelField: LabelFieldFormElement,
  SeparatorField: SeparatorFieldFormElement,
  ImageField: ImageFieldFormElement,
  FileUpload: FileUploadFormElement,
  EmailField: EmailFieldFormElement,
  PasswordField: PasswordFieldFormElement,
  SliderField: SliderFieldFormElement,
  RatingField: RatingFieldFormElement,
  ArithmeticField: ArithmeticFieldFormElement,
  SectionField: SectionFieldFormElement,
  ParagraphField: ParagraphFieldFormElement,
  RowField: RowFieldFormElement,
  ColumnField: ColumnFieldFormElement,
  HeaderField: HeaderFieldFormElement,
  FooterField: FooterFieldFormElement,
  ButtonField: ButtonFieldFormElement,
};
