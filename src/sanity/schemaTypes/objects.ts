import { defineArrayMember, defineField, defineType } from "sanity";

export const seoFaqItem = defineType({
  name: "seoFaqItem",
  title: "FAQ item",
  type: "object",
  fields: [
    defineField({ name: "question", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "answer", type: "text", rows: 4, validation: (rule) => rule.required() }),
  ],
});

export const seoRelatedLink = defineType({
  name: "seoRelatedLink",
  title: "Related link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "href", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "description", type: "string" }),
  ],
});

export const seoSection = defineType({
  name: "seoSection",
  title: "Section",
  type: "object",
  fields: [
    defineField({ name: "id", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "heading", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "text", rows: 4 })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "bullets",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "code", type: "text", rows: 8, title: "Paste-ready code" }),
  ],
});

export const seoSetupStep = defineType({
  name: "seoSetupStep",
  title: "Setup step",
  type: "object",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "description", type: "text", rows: 3, validation: (rule) => rule.required() }),
  ],
});

export const seoCta = defineType({
  name: "seoCta",
  title: "CTA",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "href", type: "string", validation: (rule) => rule.required() }),
  ],
});

export const seoComparisonRow = defineType({
  name: "seoComparisonRow",
  title: "Comparison row",
  type: "object",
  fields: [
    defineField({ name: "dimension", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "cells",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
});

export const seoComparisonTable = defineType({
  name: "seoComparisonTable",
  title: "Comparison table",
  type: "object",
  fields: [
    defineField({
      name: "headers",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "rows",
      type: "array",
      of: [defineArrayMember({ type: "seoComparisonRow" })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
});

export const seoRoundupItem = defineType({
  name: "seoRoundupItem",
  title: "Roundup item",
  type: "object",
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "bestFor", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: "watchFor", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: "href", type: "string" }),
  ],
});

export const seoPhase = defineType({
  name: "seoPhase",
  title: "Phase",
  type: "object",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "detail", type: "text", rows: 3, validation: (rule) => rule.required() }),
  ],
});

export const seoThreadLine = defineType({
  name: "seoThreadLine",
  title: "Thread line",
  type: "object",
  fields: [
    defineField({
      name: "speaker",
      type: "string",
      options: { list: ["you", "them", "draft"] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "text", type: "text", rows: 2, validation: (rule) => rule.required() }),
  ],
});

export const seoConnect = defineType({
  name: "seoConnect",
  title: "Connect matrix",
  type: "object",
  fields: [
    defineField({ name: "surface", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "auth", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "bestFor", type: "string", validation: (rule) => rule.required() }),
  ],
});

export const guideSection = defineType({
  name: "guideSection",
  title: "Guide section",
  type: "object",
  fields: [
    defineField({ name: "heading", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "paragraphs",
      type: "array",
      of: [defineArrayMember({ type: "text", rows: 4 })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "bullets",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "code", type: "text", rows: 8 }),
  ],
});

export const legalSection = defineType({
  name: "legalSection",
  title: "Legal section",
  type: "object",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "body", type: "text", rows: 8, validation: (rule) => rule.required() }),
  ],
});

export const contentTableRow = defineType({
  name: "contentTableRow",
  title: "Table row",
  type: "object",
  fields: [
    defineField({
      name: "cells",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
});

export const contentTable = defineType({
  name: "contentTable",
  title: "Table",
  type: "object",
  fields: [
    defineField({
      name: "headers",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "rows",
      type: "array",
      of: [defineArrayMember({ type: "contentTableRow" })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
});

export const codeBlock = defineType({
  name: "codeBlock",
  title: "Code",
  type: "object",
  fields: [
    defineField({ name: "language", type: "string" }),
    defineField({ name: "code", type: "text", rows: 10, validation: (rule) => rule.required() }),
  ],
});

export const blogBody = defineType({
  name: "blogBody",
  title: "Blog body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
          { title: "Code", value: "code" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({ name: "href", type: "string", validation: (rule) => rule.required() }),
              defineField({ name: "blank", type: "boolean", initialValue: false }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({ type: "contentTable" }),
    defineArrayMember({ type: "codeBlock" }),
    defineArrayMember({ type: "image", options: { hotspot: true } }),
  ],
});
