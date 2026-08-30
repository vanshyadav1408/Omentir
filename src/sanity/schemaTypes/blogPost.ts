import { defineField, defineType } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Blog post",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "meta", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "slug",
      type: "slug",
      group: "meta",
      options: { source: "title", maxLength: 120 },
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
      name: "publishedDate",
      type: "string",
      group: "meta",
      description: 'Calendar day as shown on the site, for example "August 27, 2026". Future dates stay noindex.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "updatedDate",
      type: "string",
      group: "meta",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      type: "string",
      group: "meta",
      options: {
        list: [
          "Updates",
          "Playbooks",
          "Outreach",
          "Guides",
          "Case Studies",
          "Copywriting",
          "Automation",
          "Comparisons",
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "readTime",
      type: "string",
      group: "meta",
      initialValue: "7 min read",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "banner",
      type: "image",
      group: "meta",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          type: "string",
          title: "Alt text",
        }),
      ],
      description: "Upload the banner here. Sanity stores the file on cdn.sanity.io.",
      validation: (rule) =>
        rule.custom((value, context) => {
          const src = context.document?.bannerSrc;
          if (value || (typeof src === "string" && src.length > 0)) return true;
          return "Upload a banner or set a fallback path.";
        }),
    }),
    defineField({
      name: "bannerSrc",
      type: "string",
      group: "meta",
      description: "Fallback path such as /ai-sdr-linkedin-playbook.avif when no uploaded banner is set.",
    }),
    defineField({
      name: "bannerAlt",
      type: "string",
      group: "meta",
      description: "Used when the uploaded banner has no alt text.",
    }),
    defineField({
      name: "keywords",
      type: "array",
      of: [{ type: "string" }],
      group: "meta",
      options: { layout: "tags" },
    }),
    defineField({
      name: "body",
      type: "blogBody",
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
      name: "featuredInLlms",
      type: "boolean",
      group: "meta",
      description: "Include this post in the short llms.txt answer-source list.",
      initialValue: false,
    }),
    defineField({
      name: "highIntent",
      type: "boolean",
      group: "meta",
      description: "Raise sitemap priority for this post.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "category", date: "publishedDate", media: "banner" },
    prepare({ title, subtitle, date, media }) {
      return { title, subtitle: [subtitle, date].filter(Boolean).join(" · "), media };
    },
  },
  orderings: [
    {
      title: "Published date, newest",
      name: "publishedDateDesc",
      by: [{ field: "publishedDate", direction: "desc" }],
    },
  ],
});
