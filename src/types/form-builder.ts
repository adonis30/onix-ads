// src/types/form-builder.ts

// ==================== FIELD TYPES ====================
export type FieldType =
  | 'text'
  | 'email'
  | 'number'
  | 'tel'
  | 'url'
  | 'password'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file'
  | 'signature'
  | 'rating'
  | 'slider'
  | 'toggle'
  | 'rich-text'
  | 'code'
  | 'color'
  | 'location'
  | 'currency'
  | 'custom';

// ==================== LAYOUT TYPES ====================
export type LayoutType =
  | 'container'
  | 'grid'
  | 'flex'
  | 'card'
  | 'tabs'
  | 'accordion'
  | 'stepper'
  | 'section'
  | 'divider';

// ==================== VALIDATION ====================
export interface ValidationRule {
  type:
    | 'required'
    | 'min'
    | 'max'
    | 'minLength'
    | 'maxLength'
    | 'pattern'
    | 'email'
    | 'url'
    | 'custom';
  value?: any;
  message: string;
  customValidator?: string; // Function as string for serialization
}

// ==================== CONDITIONAL LOGIC ====================
export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'startsWith'
  | 'endsWith';

export interface Condition {
  field: string; // Field ID to check
  operator: ConditionOperator;
  value?: any;
  logicalOperator?: 'AND' | 'OR'; // For multiple conditions
}

export interface ConditionalLogic {
  conditions: Condition[];
  action: 'show' | 'hide' | 'enable' | 'disable' | 'setValue' | 'validate';
  targetField?: string;
  targetValue?: any;
}

// ==================== FIELD SCHEMA ====================
export interface BaseField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  
  // Validation
  validation?: ValidationRule[];
  
  // Conditional Logic
  conditionalLogic?: ConditionalLogic[];
  
  // Styling
  className?: string;
  style?: Record<string, any>;
  width?: 'full' | 'half' | 'third' | 'quarter' | string;
  
  // Metadata
  metadata?: Record<string, any>;
}

export interface TextField extends BaseField {
  type: 'text' | 'email' | 'tel' | 'url' | 'password';
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  autoComplete?: string;
  prefix?: string;
  suffix?: string;
}

export interface TextAreaField extends BaseField {
  type: 'textarea';
  rows?: number;
  minLength?: number;
  maxLength?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
}

export interface NumberField extends BaseField {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
}

export interface SelectField extends BaseField {
  type: 'select';
  options: Array<{ label: string; value: string | number; disabled?: boolean }>;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
}

export interface RadioField extends BaseField {
  type: 'radio';
  options: Array<{ label: string; value: string | number; description?: string }>;
  layout?: 'vertical' | 'horizontal' | 'grid';
}

export interface CheckboxField extends BaseField {
  type: 'checkbox';
  options?: Array<{ label: string; value: string | number; description?: string }>;
  inline?: boolean;
}

export interface DateField extends BaseField {
  type: 'date' | 'time' | 'datetime';
  minDate?: string;
  maxDate?: string;
  format?: string;
  disabledDates?: string[];
}

export interface FileField extends BaseField {
  type: 'file';
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
}

export interface SignatureField extends BaseField {
  type: 'signature';
  penColor?: string;
  backgroundColor?: string;
  width?: number;
  height?: number;
}

export interface RatingField extends BaseField {
  type: 'rating';
  maxRating?: number;
  icon?: 'star' | 'heart' | 'thumb' | 'custom';
  allowHalf?: boolean;
}

export interface SliderField extends BaseField {
  type: 'slider';
  min: number;
  max: number;
  step?: number;
  showValue?: boolean;
  showMarks?: boolean;
}

export type FormField =
  | TextField
  | TextAreaField
  | NumberField
  | SelectField
  | RadioField
  | CheckboxField
  | DateField
  | FileField
  | SignatureField
  | RatingField
  | SliderField;

// ==================== LAYOUT SCHEMA ====================
export interface GridLayout {
  type: 'grid';
  id: string;
  columns: number;
  gap?: number;
  children: (FormField | LayoutContainer)[];
  responsive?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

export interface FlexLayout {
  type: 'flex';
  id: string;
  direction: 'row' | 'column';
  gap?: number;
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  align?: 'start' | 'center' | 'end' | 'stretch';
  children: (FormField | LayoutContainer)[];
}

export interface CardLayout {
  type: 'card';
  id: string;
  title?: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  children: (FormField | LayoutContainer)[];
}

export interface TabsLayout {
  type: 'tabs';
  id: string;
  tabs: Array<{
    id: string;
    label: string;
    icon?: string;
    children: (FormField | LayoutContainer)[];
  }>;
}

export interface AccordionLayout {
  type: 'accordion';
  id: string;
  items: Array<{
    id: string;
    title: string;
    children: (FormField | LayoutContainer)[];
  }>;
  allowMultiple?: boolean;
}

export interface StepperLayout {
  type: 'stepper';
  id: string;
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    children: (FormField | LayoutContainer)[];
  }>;
  showProgress?: boolean;
}

export interface SectionLayout {
  type: 'section';
  id: string;
  title?: string;
  description?: string;
  children: (FormField | LayoutContainer)[];
}

export type LayoutContainer =
  | GridLayout
  | FlexLayout
  | CardLayout
  | TabsLayout
  | AccordionLayout
  | StepperLayout
  | SectionLayout;

// ==================== FORM SCHEMA ====================
export interface FormTheme {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  borderRadius?: number;
  spacing?: number;
  customCss?: string;
}

export interface FormSettings {
  submitButtonText?: string;
  submitRedirectUrl?: string;
  showProgressBar?: boolean;
  allowSaveProgress?: boolean;
  enableAutosave?: boolean;
  autosaveInterval?: number; // in seconds
  showRequiredIndicator?: boolean;
  preventMultipleSubmissions?: boolean;
  captcha?: 'none' | 'recaptcha' | 'turnstile';
  notificationEmail?: string;
  confirmationEmail?: {
    enabled: boolean;
    subject?: string;
    body?: string;
  };
}

export interface FormSchema {
  version: string;
  fields: (FormField | LayoutContainer)[];
  settings?: FormSettings;
  theme?: FormTheme;
  metadata?: Record<string, any>;
}

// ==================== AI COPILOT ====================
export interface AISuggestion {
  id: string;
  type: 'field' | 'layout' | 'validation' | 'optimization';
  title: string;
  description: string;
  preview?: FormSchema;
  confidence: number; // 0-1
  action: () => void;
}

export interface AIGenerationRequest {
  prompt: string;
  context?: {
    existingFields?: string[];
    industry?: string;
    purpose?: string;
  };
}

export interface AIGenerationResponse {
  schema: FormSchema;
  suggestions: AISuggestion[];
  metadata: {
    generatedAt: string;
    model: string;
    tokens: number;
  };
}

// ==================== BUILDER STATE ====================
export interface BuilderState {
  schema: FormSchema;
  selectedField: string | null;
  copiedField: FormField | LayoutContainer | null;
  history: FormSchema[];
  historyIndex: number;
  isDirty: boolean;
  isSaving: boolean;
  mode: 'design' | 'preview' | 'logic';
}

// ==================== COMPONENT REGISTRY ====================
export interface ComponentDefinition {
  type: FieldType | LayoutType;
  label: string;
  icon: string;
  category: 'input' | 'choice' | 'layout' | 'advanced' | 'custom';
  description: string;
  defaultProps: Partial<FormField | LayoutContainer>;
  previewComponent: React.ComponentType<any>;
  editorComponent: React.ComponentType<any>;
  propertySchema: PropertySchema[];
}

export interface PropertySchema {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'json';
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  description?: string;
  validation?: ValidationRule[];
}

// ==================== DRAG AND DROP ====================
export interface DragItem {
  id: string;
  type: 'new-field' | 'existing-field';
  fieldType?: FieldType | LayoutType;
  field?: FormField | LayoutContainer;
}

export interface DropZone {
  id: string;
  parentId?: string;
  index: number;
  accepts: ('field' | 'layout')[];
}

// ==================== VERSIONING ====================
export interface FormVersion {
  id: string;
  version: number;
  schema: FormSchema;
  changeLog: string;
  createdBy: string;
  createdAt: string;
}

// ==================== COLLABORATION ====================
export type CollaboratorRole = 'OWNER' | 'EDITOR' | 'VIEWER' | 'COMMENTER';

export interface Collaborator {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: CollaboratorRole;
  isActive: boolean;
  cursor?: {
    x: number;
    y: number;
    fieldId?: string;
  };
}

// ==================== AUDIT LOG ====================
export type AuditAction =
  | 'CREATED'
  | 'UPDATED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'DELETED'
  | 'CLONED'
  | 'VERSION_CREATED'
  | 'SETTINGS_CHANGED'
  | 'FIELD_ADDED'
  | 'FIELD_REMOVED'
  | 'FIELD_UPDATED'
  | 'LAYOUT_CHANGED';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  userId: string;
  userName: string;
  changes: Record<string, any>;
  timestamp: string;
}
