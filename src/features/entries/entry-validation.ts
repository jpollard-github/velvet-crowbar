import { z } from "zod";
import { hasPublicRoute } from "./publication-policy";

export const ENTRY_KINDS = [
  "translation",
  "essay",
  "observation",
  "autopsy",
  "manifesto",
  "fragment",
] as const;

export const VISIBILITIES = ["private", "draft", "public"] as const;

export const entryKindSchema = z.enum(ENTRY_KINDS);
export const visibilitySchema = z.enum(VISIBILITIES);

export const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens.",
  );

const optionalText = z
  .string()
  .trim()
  .max(10_000)
  .nullable()
  .transform((value) => value || null);

export const entryInputSchema = z
  .object({
    slug: slugSchema,
    kind: entryKindSchema,
    visibility: visibilitySchema.default("private"),
    title: z.string().trim().min(2).max(200),
    deck: optionalText,
    politeSentence: optionalText,
    translation: optionalText,
    systemUnderneath: optionalText,
    usefulPrinciple: optionalText,
    body: z.string().max(100_000).default(""),
    tags: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(40)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      )
      .max(20)
      .default([]),
    sourceEntryId: z.uuid().nullable().default(null),
    publicationReviewed: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (value.visibility === "public" && !hasPublicRoute(value.kind)) {
      context.addIssue({
        code: "custom",
        path: ["visibility"],
        message: "This entry kind does not have a public route yet.",
      });
    }
    if (value.visibility === "public" && !value.publicationReviewed) {
      context.addIssue({
        code: "custom",
        path: ["publicationReviewed"],
        message: "Acknowledge the publication review before publishing.",
      });
    }
    if (value.kind === "translation" && value.visibility === "public") {
      for (const [field, label] of [
        ["politeSentence", "Polite sentence"],
        ["translation", "Translation"],
        ["systemUnderneath", "System underneath"],
        ["usefulPrinciple", "Useful principle"],
      ] as const) {
        if (!value[field]) {
          context.addIssue({
            code: "custom",
            path: [field],
            message: `${label} is required for a public translation.`,
          });
        }
      }
    }
  });

export type EntryInput = z.infer<typeof entryInputSchema>;

export function newEntryDefaults(): EntryInput {
  return {
    slug: "",
    kind: "fragment",
    visibility: "private",
    title: "",
    deck: null,
    politeSentence: null,
    translation: null,
    systemUnderneath: null,
    usefulPrinciple: null,
    body: "",
    tags: [],
    sourceEntryId: null,
    publicationReviewed: false,
  };
}

export function entryInputFromFormData(formData: FormData) {
  return entryInputSchema.safeParse({
    slug: formData.get("slug"),
    kind: formData.get("kind"),
    visibility: formData.get("visibility") ?? "private",
    title: formData.get("title"),
    deck: formData.get("deck") ?? "",
    politeSentence: formData.get("politeSentence") ?? "",
    translation: formData.get("translation") ?? "",
    systemUnderneath: formData.get("systemUnderneath") ?? "",
    usefulPrinciple: formData.get("usefulPrinciple") ?? "",
    body: formData.get("body") ?? "",
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    sourceEntryId: formData.get("sourceEntryId") || null,
    publicationReviewed: formData.get("publicationReviewed") === "on",
  });
}
