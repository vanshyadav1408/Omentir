import { defineField, defineType } from "sanity";

export const helpArticle = defineType({
  name: "helpArticle",
  title: "Help article",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "question", maxLength: 120 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "question", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "description", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: "keywords",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "cluster",
      type: "string",
      options: {
        list: [
          { title: "Limits and account health", value: "limits" },
          { title: "Profile and presence", value: "profile" },
          { title: "Connection requests", value: "requests" },
          { title: "Messages and follow-ups", value: "messages" },
          { title: "InMail, Premium, and Sales Navigator", value: "inmail" },
          { title: "Targeting and B2B sales", value: "targeting" },
          { title: "Cold email", value: "email" },
          { title: "Rules and tools", value: "rules" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "publishedDate", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "updatedDate", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "paragraphs",
      type: "array",
      of: [{ type: "text", rows: 4 }],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: "prompt", type: "text", rows: 10, title: "Paste-ready prompt" }),
    defineField({
      name: "faqItems",
      type: "array",
      of: [{ type: "seoFaqItem" }],
    }),
    defineField({
      name: "relatedSlugs",
      type: "array",
      of: [{ type: "string" }],
      description: "Other help article slugs to link under the answer.",
    }),
  ],
  preview: {
    select: { title: "question", subtitle: "cluster" },
  },
});
