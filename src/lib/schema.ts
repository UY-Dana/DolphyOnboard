import { z } from "zod";
import * as c from "./config";
const short = z.string().trim().max(300);
const long = z.string().trim().max(1800);
const url = z
  .string()
  .trim()
  .max(500)
  .refine(
    (v) =>
      !v ||
      (() => {
        try {
          return ["http:", "https:"].includes(new URL(v).protocol);
        } catch {
          return false;
        }
      })(),
    "Use a full link, such as https://example.com",
  );
const choices = (options: string[], max = options.length) =>
  z
    .array(z.string())
    .max(max)
    .refine(
      (v) =>
        v.every((x) => options.includes(x)) && new Set(v).size === v.length,
      "Choose from the available options",
    );
const choice = (options: string[]) =>
  z.string().refine((v) => options.includes(v), "Please choose an option");
export const draftSchema = z.object({
  name: short,
  email: short,
  phone: short,
  location: short,
  brand: short,
  website: z.string().max(500),
  social: z.string().max(500),
  industry: choices(c.industries),
  description: long,
  websiteType: z.string(),
  features: choices(c.features),
  otherFeature: short,
  size: z.string(),
  moods: choices(c.moods, 3),
  references: z.array(z.string().max(500)).length(3),
  avoid: long,
  assets: choices(c.assets),
  services: choices(c.services),
  timeline: z.string(),
  budget: z.string(),
  notes: long,
});
export type Brief = z.infer<typeof draftSchema>;
export const initialBrief: Brief = {
  name: "",
  email: "",
  phone: "",
  location: "",
  brand: "",
  website: "",
  social: "",
  industry: [],
  description: "",
  websiteType: "",
  features: [],
  otherFeature: "",
  size: "",
  moods: [],
  references: ["", "", ""],
  avoid: "",
  assets: [],
  services: [],
  timeline: "",
  budget: "",
  notes: "",
};
export const stepSchemas = [
  z.object({
    name: short.min(1, "Please enter your name"),
    email: z.email("Please enter a valid email").max(300),
    brand: short.min(1, "Please enter your brand name"),
    website: url,
    social: url,
  }),
  z
    .object({
      websiteType: choice(c.websiteTypes),
      size: choice(c.sizes),
      features: choices(c.features).min(1, "Choose at least one feature"),
      otherFeature: short,
    })
    .refine((v) => !v.features.includes("Other") || !!v.otherFeature, {
      path: ["otherFeature"],
      message: "Tell us what else you need",
    }),
  z.object({ moods: choices(c.moods, 3), references: z.array(url).length(3) }),
  z.object({
    assets: choices(c.assets).refine(
      (v) => !v.includes("Nothing Yet") || v.length === 1,
      "Choose Nothing Yet on its own",
    ),
    services: choices(c.services),
  }),
  z.object({
    timeline: choice(c.timelines),
    budget: choice(["", ...c.budgetConfig.options]),
  }),
];
export function validateStep(
  brief: Brief,
  step: number,
): Record<string, string> {
  const result = stepSchemas[step - 1]?.safeParse(brief);
  return result && !result.success
    ? Object.fromEntries(
        result.error.issues.map((i) => [i.path.join("."), i.message]),
      )
    : {};
}
export const submissionSchema = draftSchema
  .extend({ honeypot: z.string().max(0), submissionId: z.uuid() })
  .superRefine((data, ctx) => {
    for (const schema of stepSchemas) {
      const result = schema.safeParse(data);
      if (!result.success)
        for (const issue of result.error.issues)
          ctx.addIssue({
            code: "custom",
            path: issue.path,
            message: issue.message,
          });
    }
  });
