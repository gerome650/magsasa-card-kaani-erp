import { z } from "zod";

const SlotSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(['select', 'text', 'number', 'date', 'boolean']),
  required: z.boolean(),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
  saveToProfile: z.boolean().optional(),
  profileField: z.string().optional(),
});

const ConditionSchema = z.object({
  slotKey: z.string(),
  op: z.enum(['equals', 'notEquals', 'exists', 'missing', 'gt', 'lt', 'in']),
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]).optional(),
});

const StepSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  slotKeys: z.array(z.string()),
  suggestions: z.array(z.string()).optional(),
  next: z.union([
    z.string(),
    z.object({
      when: z.array(ConditionSchema),
      go: z.string(),
      elseGo: z.string().optional(),
    }),
  ]).optional(),
});

const ReportTemplateSchema = z.object({
  format: z.literal('markdown'),
  sections: z.array(z.object({
    title: z.string(),
    body: z.string(),
  })),
}).optional();

export const FlowPackageSchema = z.object({
  id: z.string(),
  version: z.string(),
  audience: z.enum(['loan_officer', 'farmer']),
  dialectsSupported: z.array(z.string()),
  intro: z.object({
    title: z.string(),
    description: z.string(),
  }),
  slots: z.array(SlotSchema),
  steps: z.array(StepSchema),
  reportTemplate: ReportTemplateSchema,
});

export type FlowPackageType = z.infer<typeof FlowPackageSchema>;



