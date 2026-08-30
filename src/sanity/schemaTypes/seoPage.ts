import { defineField, defineType } from "sanity";

const families = [
  { title: "Features", value: "features" },
  { title: "Comparisons", value: "comparisons" },
  { title: "Integrations", value: "integrations" },
  { title: "Use cases", value: "use-cases" },
  { title: "Alternatives", value: "alternatives" },
];

export const seoPage = defineType({
  name: "seoPage",
  title: "SEO page",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "structure", title: "Layout" },
    { name: "meta", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "family",
      type: "string",
      group: "meta",
      options: { list: families, layout: "radio" },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "meta",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "title", type: "string", group: "content", validation: (rule) => rule.required() }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "summary",
      type: "text",
      rows: 2,
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publishedDate",
      type: "string",
      group: "meta",
      description: 'Calendar day as shown on the site, for example "August 12, 2026".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "updatedDate",
      type: "string",
      group: "meta",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "keywords",
      type: "array",
      of: [{ type: "string" }],
      group: "meta",
      options: { layout: "tags" },
    }),
    defineField({
      name: "layout",
      type: "string",
      group: "structure",
      options: {
        list: ["split", "faceoff", "timeline", "roundup", "thread", "phases", "article"],
      },
    }),
    defineField({ name: "verdict", type: "text", rows: 3, group: "content" }),
    defineField({
      name: "highlights",
      type: "array",
      of: [{ type: "string" }],
      group: "structure",
    }),
    defineField({
      name: "who",
      type: "string",
      group: "content",
      hidden: ({ document }) => document?.family !== "use-cases",
    }),
    defineField({
      name: "connect",
      type: "seoConnect",
      group: "content",
      hidden: ({ document }) => document?.family !== "integrations",
    }),
    defineField({
      name: "sections",
      type: "array",
      of: [{ type: "seoSection" }],
      group: "content",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "faqItems",
      type: "array",
      of: [{ type: "seoFaqItem" }],
      group: "content",
    }),
    defineField({
      name: "relatedLinks",
      type: "array",
      of: [{ type: "seoRelatedLink" }],
      group: "content",
    }),
    defineField({
      name: "setupSteps",
      type: "array",
      of: [{ type: "seoSetupStep" }],
      group: "structure",
    }),
    defineField({
      name: "comparisonTable",
      type: "seoComparisonTable",
      group: "structure",
      hidden: ({ document }) => document?.family !== "comparisons",
    }),
    defineField({
      name: "roundupItems",
      type: "array",
      of: [{ type: "seoRoundupItem" }],
      group: "structure",
      hidden: ({ document }) => document?.family !== "alternatives",
    }),
    defineField({
      name: "phases",
      type: "array",
      of: [{ type: "seoPhase" }],
      group: "structure",
    }),
    defineField({
      name: "thread",
      type: "array",
      of: [{ type: "seoThreadLine" }],
      group: "structure",
    }),
    defineField({ name: "ctaTitle", type: "string", group: "content" }),
    defineField({ name: "ctaBody", type: "text", rows: 3, group: "content" }),
    defineField({ name: "primaryCta", type: "seoCta", group: "content" }),
    defineField({ name: "secondaryCta", type: "seoCta", group: "content" }),
  ],
  preview: {
    select: { title: "title", family: "family", slug: "slug.current" },
    prepare({ title, family, slug }) {
      return {
        title: title || slug,
        subtitle: [family, slug].filter(Boolean).join(" / "),
      };
    },
  },
});
