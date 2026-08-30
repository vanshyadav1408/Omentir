import { defineField, defineType } from "sanity";

export const legalPage = defineType({
  name: "legalPage",
  title: "Legal page",
  type: "document",
  fields: [
    defineField({
      name: "slug",
      type: "string",
      options: {
        list: [
          { title: "Privacy policy", value: "privacy-policy" },
          { title: "Terms of service", value: "terms-of-service" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "description", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: "lede",
      type: "text",
      rows: 2,
      description: "Shown under the H1 on the page.",
    }),
    defineField({
      name: "keywords",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "updatedDate",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sections",
      type: "array",
      of: [{ type: "legalSection" }],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: "title", slug: "slug" },
    prepare({ title, slug }) {
      return { title, subtitle: slug };
    },
  },
});
