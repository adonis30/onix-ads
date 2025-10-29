// src/lib/form-builder/ai-form-generator.ts

import { AIChatSession } from '@/lib/google-ai';
import type { FormSchema, FormField, LayoutContainer, AIGenerationRequest, AIGenerationResponse } from '@/types/form-builder';

export class AIFormGenerator {
  /**
   * Generate a complete form schema from natural language prompt
   */
  static async generateFormFromPrompt(
    prompt: string,
    context?: AIGenerationRequest['context']
  ): Promise<FormSchema> {
    const systemPrompt = this.buildFormGenerationPrompt(prompt, context);

    try {
      const result = await AIChatSession.sendMessage(systemPrompt);
      const response = result.response;
      const text = response.text();
      
      // Parse JSON response
      const generatedData = JSON.parse(text);
      
      // Transform to our form schema
      return this.transformAIResponseToSchema(generatedData);
    } catch (error) {
      console.error('AI Form Generation Error:', error);
      throw new Error('Failed to generate form from prompt');
    }
  }

  /**
   * Generate field suggestions based on existing form
   */
  static async suggestFields(
    existingFields: (FormField | LayoutContainer)[],
    context?: string
  ): Promise<FormField[]> {
    const prompt = this.buildFieldSuggestionPrompt(existingFields, context);

    try {
      const result = await AIChatSession.sendMessage(prompt);
      const response = result.response;
      const text = response.text();
      
      const suggestions = JSON.parse(text);
      return suggestions.fields || [];
    } catch (error) {
      console.error('Field Suggestion Error:', error);
      return [];
    }
  }

  /**
   * Generate validation rules for a field
   */
  static async suggestValidation(
    field: FormField,
    context?: string
  ): Promise<any[]> {
    const prompt = `
Generate validation rules for the following form field:

Field Type: ${field.type}
Label: ${field.label}
Context: ${context || 'General form'}

Return JSON array of validation rules with this structure:
[
  {
    "type": "required" | "min" | "max" | "minLength" | "maxLength" | "pattern" | "email" | "url",
    "value": any, // optional
    "message": "User-friendly error message"
  }
]

Consider best practices and common validation needs for this field type.
Only return the JSON array, no additional text.
    `;

    try {
      const result = await AIChatSession.sendMessage(prompt);
      const response = result.response;
      const text = response.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Validation Suggestion Error:', error);
      return [];
    }
  }

  /**
   * Optimize form layout
   */
  static async optimizeLayout(
    schema: FormSchema,
    goal: 'conversion' | 'accessibility' | 'mobile' | 'speed'
  ): Promise<FormSchema> {
    const prompt = `
Analyze and optimize the following form schema for ${goal}:

Current Schema:
${JSON.stringify(schema, null, 2)}

Return an optimized version of the schema with improvements for ${goal}.
Consider:
- Field ordering
- Grouping related fields
- Layout containers
- Progressive disclosure
- Mobile responsiveness

Only return the complete optimized JSON schema, no additional text.
    `;

    try {
      const result = await AIChatSession.sendMessage(prompt);
      const response = result.response;
      const text = response.text();
      
      return JSON.parse(text);
    } catch (error) {
      console.error('Layout Optimization Error:', error);
      return schema; // Return original if optimization fails
    }
  }

  /**
   * Build comprehensive form generation prompt
   */
  private static buildFormGenerationPrompt(
    userPrompt: string,
    context?: AIGenerationRequest['context']
  ): string {
    const existingFieldsContext = context?.existingFields?.length 
      ? `\nExisting fields: ${context.existingFields.join(', ')}`
      : '';

    const industryContext = context?.industry 
      ? `\nIndustry: ${context.industry}`
      : '';

    const purposeContext = context?.purpose 
      ? `\nPurpose: ${context.purpose}`
      : '';

    return `
You are an expert form designer. Generate a complete form schema based on the following request:

User Request: "${userPrompt}"
${industryContext}
${purposeContext}
${existingFieldsContext}

Generate a professional, user-friendly form with appropriate field types, labels, validation, and layout.

Available Field Types:
- text, email, number, tel, url, password (text inputs)
- textarea (multi-line text)
- select, radio, checkbox (choice fields)
- date, time, datetime (date/time pickers)
- file (file upload)
- signature (digital signature)
- rating (star rating)
- slider (range slider)

Available Layout Types:
- grid (multi-column layout)
- flex (flexible layout)
- card (grouped content with title)
- tabs (tabbed sections)
- accordion (collapsible sections)
- stepper (multi-step form)
- section (content section with heading)

Return JSON in this exact structure:
{
  "version": "1.0",
  "fields": [
    {
      "id": "unique_id",
      "type": "field_type",
      "label": "Field Label",
      "placeholder": "Optional placeholder",
      "required": true/false,
      "validation": [
        {
          "type": "required",
          "message": "This field is required"
        }
      ],
      // ... other field-specific properties
    }
  ],
  "settings": {
    "submitButtonText": "Submit",
    "showProgressBar": false,
    "showRequiredIndicator": true
  },
  "theme": {
    "primaryColor": "#3b82f6",
    "borderRadius": 8,
    "spacing": 16
  }
}

Guidelines:
1. Use descriptive, user-friendly labels
2. Add helpful placeholders and descriptions
3. Include appropriate validation rules
4. Group related fields using layout containers
5. Consider mobile responsiveness
6. Add required indicators where appropriate
7. Use consistent styling
8. Generate unique IDs for all fields

Only return the JSON schema, no additional text or explanation.
    `;
  }

  /**
   * Build field suggestion prompt
   */
  private static buildFieldSuggestionPrompt(
    existingFields: (FormField | LayoutContainer)[],
    context?: string
  ): string {
    const fieldSummary = existingFields.map(f => {
      if ('type' in f && typeof f.type === 'string') {
        return `${f.type}: ${f.label}`;
      }
      return 'layout container';
    }).join(', ');

    return `
Analyze the existing form fields and suggest 3-5 additional relevant fields that would improve the form.

Existing Fields: ${fieldSummary}
Context: ${context || 'General form'}

Return JSON array of suggested fields:
{
  "fields": [
    {
      "id": "suggested_field_id",
      "type": "field_type",
      "label": "Suggested Label",
      "placeholder": "Placeholder text",
      "required": false,
      "description": "Why this field would be useful"
    }
  ]
}

Only suggest fields that:
1. Are not already present
2. Are commonly associated with existing fields
3. Would add value to the form
4. Make sense in the given context

Only return the JSON, no additional text.
    `;
  }

  /**
   * Transform AI response to our form schema structure
   */
  private static transformAIResponseToSchema(aiResponse: any): FormSchema {
    // If AI returns fields directly, wrap in schema
    if (Array.isArray(aiResponse)) {
      return {
        version: '1.0',
        fields: aiResponse,
        settings: {
          submitButtonText: 'Submit',
          showRequiredIndicator: true,
        },
        theme: {
          primaryColor: '#3b82f6',
          borderRadius: 8,
          spacing: 16,
        },
      };
    }

    // If AI returns full schema, validate and return
    return {
      version: aiResponse.version || '1.0',
      fields: aiResponse.fields || [],
      settings: aiResponse.settings || {
        submitButtonText: 'Submit',
        showRequiredIndicator: true,
      },
      theme: aiResponse.theme || {
        primaryColor: '#3b82f6',
        borderRadius: 8,
        spacing: 16,
      },
      metadata: aiResponse.metadata,
    };
  }

  /**
   * Generate form templates for common use cases
   */
  static async generateTemplate(
    category: 'contact' | 'registration' | 'survey' | 'application' | 'feedback' | 'order'
  ): Promise<FormSchema> {
    const templates = {
      contact: 'Create a professional contact form with name, email, phone, subject, and message',
      registration: 'Create a user registration form with username, email, password, confirm password, terms acceptance',
      survey: 'Create a customer satisfaction survey with rating scales, multiple choice, and open-ended questions',
      application: 'Create a job application form with personal info, work experience, education, and file upload for resume',
      feedback: 'Create a product feedback form with rating, categories, detailed feedback, and contact information',
      order: 'Create an order form with product selection, quantity, shipping address, and payment method',
    };

    return this.generateFormFromPrompt(templates[category]);
  }
}
