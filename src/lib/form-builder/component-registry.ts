// src/lib/form-builder/component-registry.ts

import type { ComponentDefinition, FieldType, LayoutType } from '@/types/form-builder';
import {
  Type,
  Mail,
  Hash,
  Phone,
  Link,
  Lock,
  TextQuote,
  List,
  Circle,
  CheckSquare,
  Calendar,
  Clock,
  FileUp,
  PenTool,
  Star,
  Sliders,
  LayoutGrid,
  Rows,
  Square,
  Layers,
  FoldVertical,
  GitBranch,
  SplitSquareVertical,
} from 'lucide-react';

export class ComponentRegistry {
  private static components = new Map<string, ComponentDefinition>();

  // Register all default components
  static initialize() {
    // INPUT COMPONENTS
    this.register({
      type: 'text',
      label: 'Text Input',
      icon: 'Type',
      category: 'input',
      description: 'Single line text input',
      defaultProps: {
        id: '',
        type: 'text',
        label: 'Text Field',
        placeholder: 'Enter text...',
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'minLength', label: 'Min Length', type: 'number' },
        { key: 'maxLength', label: 'Max Length', type: 'number' },
        { key: 'prefix', label: 'Prefix', type: 'text' },
        { key: 'suffix', label: 'Suffix', type: 'text' },
      ],
    });

    this.register({
      type: 'email',
      label: 'Email',
      icon: 'Mail',
      category: 'input',
      description: 'Email address input with validation',
      defaultProps: {
        id: '',
        type: 'email',
        label: 'Email',
        placeholder: 'you@example.com',
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
      ],
    });

    this.register({
      type: 'number',
      label: 'Number',
      icon: 'Hash',
      category: 'input',
      description: 'Numeric input with validation',
      defaultProps: {
        id: '',
        type: 'number',
        label: 'Number',
        placeholder: '0',
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'min', label: 'Minimum', type: 'number' },
        { key: 'max', label: 'Maximum', type: 'number' },
        { key: 'step', label: 'Step', type: 'number' },
      ],
    });

    this.register({
      type: 'tel',
      label: 'Phone',
      icon: 'Phone',
      category: 'input',
      description: 'Phone number input',
      defaultProps: {
        id: '',
        type: 'tel',
        label: 'Phone',
        placeholder: '+1 (555) 000-0000',
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
      ],
    });

    this.register({
      type: 'url',
      label: 'URL',
      icon: 'Link',
      category: 'input',
      description: 'Website URL input',
      defaultProps: {
        id: '',
        type: 'url',
        label: 'Website',
        placeholder: 'https://example.com',
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
      ],
    });

    this.register({
      type: 'password',
      label: 'Password',
      icon: 'Lock',
      category: 'input',
      description: 'Secure password input',
      defaultProps: {
        id: '',
        type: 'password',
        label: 'Password',
        placeholder: '••••••••',
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'minLength', label: 'Min Length', type: 'number' },
      ],
    });

    this.register({
      type: 'textarea',
      label: 'Text Area',
      icon: 'TextQuote',
      category: 'input',
      description: 'Multi-line text input',
      defaultProps: {
        id: '',
        type: 'textarea',
        label: 'Message',
        placeholder: 'Enter your message...',
        rows: 4,
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'rows', label: 'Rows', type: 'number' },
        { key: 'minLength', label: 'Min Length', type: 'number' },
        { key: 'maxLength', label: 'Max Length', type: 'number' },
      ],
    });

    // CHOICE COMPONENTS
    this.register({
      type: 'select',
      label: 'Select Dropdown',
      icon: 'List',
      category: 'choice',
      description: 'Dropdown selection list',
      defaultProps: {
        id: '',
        type: 'select',
        label: 'Select Option',
        placeholder: 'Choose an option...',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
          { label: 'Option 3', value: 'option3' },
        ],
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'placeholder', label: 'Placeholder', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'options', label: 'Options', type: 'json' },
        { key: 'multiple', label: 'Multiple Selection', type: 'boolean' },
        { key: 'searchable', label: 'Searchable', type: 'boolean' },
      ],
    });

    this.register({
      type: 'radio',
      label: 'Radio Buttons',
      icon: 'Circle',
      category: 'choice',
      description: 'Single selection from options',
      defaultProps: {
        id: '',
        type: 'radio',
        label: 'Choose One',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
        ],
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'options', label: 'Options', type: 'json' },
        {
          key: 'layout',
          label: 'Layout',
          type: 'select',
          options: [
            { label: 'Vertical', value: 'vertical' },
            { label: 'Horizontal', value: 'horizontal' },
            { label: 'Grid', value: 'grid' },
          ],
        },
      ],
    });

    this.register({
      type: 'checkbox',
      label: 'Checkboxes',
      icon: 'CheckSquare',
      category: 'choice',
      description: 'Multiple selection from options',
      defaultProps: {
        id: '',
        type: 'checkbox',
        label: 'Select All That Apply',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' },
        ],
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'options', label: 'Options', type: 'json' },
        { key: 'inline', label: 'Inline Layout', type: 'boolean' },
      ],
    });

    // DATE/TIME COMPONENTS
    this.register({
      type: 'date',
      label: 'Date Picker',
      icon: 'Calendar',
      category: 'input',
      description: 'Date selection input',
      defaultProps: {
        id: '',
        type: 'date',
        label: 'Date',
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'minDate', label: 'Min Date', type: 'text' },
        { key: 'maxDate', label: 'Max Date', type: 'text' },
        { key: 'format', label: 'Date Format', type: 'text' },
      ],
    });

    this.register({
      type: 'time',
      label: 'Time Picker',
      icon: 'Clock',
      category: 'input',
      description: 'Time selection input',
      defaultProps: {
        id: '',
        type: 'time',
        label: 'Time',
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
      ],
    });

    // ADVANCED COMPONENTS
    this.register({
      type: 'file',
      label: 'File Upload',
      icon: 'FileUp',
      category: 'advanced',
      description: 'File upload input',
      defaultProps: {
        id: '',
        type: 'file',
        label: 'Upload File',
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'accept', label: 'Accepted Types', type: 'text' },
        { key: 'multiple', label: 'Multiple Files', type: 'boolean' },
        { key: 'maxSize', label: 'Max Size (bytes)', type: 'number' },
        { key: 'maxFiles', label: 'Max Files', type: 'number' },
      ],
    });

    this.register({
      type: 'signature',
      label: 'Signature',
      icon: 'PenTool',
      category: 'advanced',
      description: 'Digital signature pad',
      defaultProps: {
        id: '',
        type: 'signature',
        label: 'Signature',
        required: false,
        penColor: '#000000',
        backgroundColor: '#ffffff',
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'penColor', label: 'Pen Color', type: 'color' },
        { key: 'backgroundColor', label: 'Background Color', type: 'color' },
      ],
    });

    this.register({
      type: 'rating',
      label: 'Rating',
      icon: 'Star',
      category: 'advanced',
      description: 'Star rating input',
      defaultProps: {
        id: '',
        type: 'rating',
        label: 'Rate Us',
        maxRating: 5,
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'maxRating', label: 'Max Rating', type: 'number' },
        { key: 'allowHalf', label: 'Allow Half Stars', type: 'boolean' },
      ],
    });

    this.register({
      type: 'slider',
      label: 'Slider',
      icon: 'Sliders',
      category: 'advanced',
      description: 'Range slider input',
      defaultProps: {
        id: '',
        type: 'slider',
        label: 'Select Value',
        min: 0,
        max: 100,
        step: 1,
        required: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'label', label: 'Label', type: 'text' },
        { key: 'required', label: 'Required', type: 'boolean' },
        { key: 'min', label: 'Minimum', type: 'number' },
        { key: 'max', label: 'Maximum', type: 'number' },
        { key: 'step', label: 'Step', type: 'number' },
        { key: 'showValue', label: 'Show Value', type: 'boolean' },
      ],
    });

    // LAYOUT COMPONENTS
    this.register({
      type: 'grid',
      label: 'Grid Layout',
      icon: 'LayoutGrid',
      category: 'layout',
      description: 'Multi-column grid container',
      defaultProps: {
        id: '',
        type: 'grid',
        columns: 2,
        gap: 16,
        children: [],
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'columns', label: 'Columns', type: 'number' },
        { key: 'gap', label: 'Gap (px)', type: 'number' },
      ],
    });

    this.register({
      type: 'flex',
      label: 'Flex Layout',
      icon: 'Rows',
      category: 'layout',
      description: 'Flexible box container',
      defaultProps: {
        id: '',
        type: 'flex',
        direction: 'row',
        gap: 16,
        children: [],
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        {
          key: 'direction',
          label: 'Direction',
          type: 'select',
          options: [
            { label: 'Row', value: 'row' },
            { label: 'Column', value: 'column' },
          ],
        },
        { key: 'gap', label: 'Gap (px)', type: 'number' },
      ],
    });

    this.register({
      type: 'card',
      label: 'Card',
      icon: 'Square',
      category: 'layout',
      description: 'Card container with title',
      defaultProps: {
        id: '',
        type: 'card',
        title: 'Card Title',
        children: [],
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'collapsible', label: 'Collapsible', type: 'boolean' },
      ],
    });

    this.register({
      type: 'tabs',
      label: 'Tabs',
      icon: 'Layers',
      category: 'layout',
      description: 'Tabbed content',
      defaultProps: {
        id: '',
        type: 'tabs',
        tabs: [
          { id: 'tab1', label: 'Tab 1', children: [] },
          { id: 'tab2', label: 'Tab 2', children: [] },
        ],
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [{ key: 'tabs', label: 'Tabs', type: 'json' }],
    });

    this.register({
      type: 'accordion',
      label: 'Accordion',
      icon: 'FoldVertical',
      category: 'layout',
      description: 'Collapsible sections',
      defaultProps: {
        id: '',
        type: 'accordion',
        items: [
          { id: 'item1', title: 'Section 1', children: [] },
          { id: 'item2', title: 'Section 2', children: [] },
        ],
        allowMultiple: false,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'items', label: 'Items', type: 'json' },
        { key: 'allowMultiple', label: 'Allow Multiple Open', type: 'boolean' },
      ],
    });

    this.register({
      type: 'stepper',
      label: 'Stepper',
      icon: 'GitBranch',
      category: 'layout',
      description: 'Multi-step form',
      defaultProps: {
        id: '',
        type: 'stepper',
        steps: [
          { id: 'step1', title: 'Step 1', children: [] },
          { id: 'step2', title: 'Step 2', children: [] },
        ],
        showProgress: true,
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'steps', label: 'Steps', type: 'json' },
        { key: 'showProgress', label: 'Show Progress', type: 'boolean' },
      ],
    });

    this.register({
      type: 'section',
      label: 'Section',
      icon: 'SplitSquareVertical',
      category: 'layout',
      description: 'Content section',
      defaultProps: {
        id: '',
        type: 'section',
        title: 'Section Title',
        children: [],
      },
      previewComponent: null as any,
      editorComponent: null as any,
      propertySchema: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
      ],
    });
  }

  static register(component: ComponentDefinition) {
    this.components.set(component.type, component);
  }

  static get(type: FieldType | LayoutType): ComponentDefinition | undefined {
    return this.components.get(type);
  }

  static getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  static getByCategory(category: ComponentDefinition['category']): ComponentDefinition[] {
    return this.getAll().filter((c) => c.category === category);
  }

  static createField(type: FieldType | LayoutType, overrides?: any): any {
    const definition = this.get(type);
    if (!definition) {
      throw new Error(`Component type "${type}" not found in registry`);
    }

    return {
      ...definition.defaultProps,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...overrides,
    };
  }
}

// Initialize registry on module load
ComponentRegistry.initialize();
