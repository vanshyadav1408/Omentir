import { defineField, defineType } from "sanity";

export const guide = defineType({
  name: "guide",
  title: "Guide",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "description", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: "query", type: "string" }),
    defineField({ name: "kicker", type: "string" }),
    defineField({
      name: "cluster",
      type: "string",
      options: {
        list: [
          { title: "LinkedIn", value: "linkedin" },
          { title: "B2B", value: "b2b" },
          { title: "Email", value: "email" },
          { title: "General", value: "general" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "publishedDate", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "updatedDate", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "keywords",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "ogImage",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
        }),
      ],
      description: "Social card and page hero. Served from cdn.sanity.io.",
    }),
    defineField({
      name: "sections",
      type: "array",
      of: [{ type: "guideSection" }],
    }),
    defineField({
      name: "faqItems",
      type: "array",
      of: [{ type: "seoFaqItem" }],
    }),
    defineField({
      name: "related",
      type: "array",
      of: [{ type: "seoRelatedLink" }],
    }),
    defineField({ name: "relatedHeading", type: "string" }),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current" },
  },
});
