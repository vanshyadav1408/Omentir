import { groq } from "next-sanity";

const seoPageFields = groq`{
  "slug": slug.current,
  title,
  description,
  summary,
  publishedDate,
  updatedDate,
  keywords,
  layout,
  verdict,
  highlights,
  who,
  connect,
  ctaTitle,
  ctaBody,
  primaryCta,
  secondaryCta,
  sections[]{ id, heading, paragraphs, bullets, code },
  faqItems[]{ question, answer },
  relatedLinks[]{ label, href, description },
  setupSteps[]{ title, description },
  comparisonTable{ headers, rows[]{ dimension, cells } },
  roundupItems[]{ name, bestFor, watchFor, href },
  phases[]{ title, detail },
  thread[]{ speaker, text }
}`;

export const seoPagesByFamilyQuery = groq`*[_type == "seoPage" && family == $family] | order(title asc) ${seoPageFields}`;

export const seoPageBySlugQuery = groq`*[_type == "seoPage" && family == $family && slug.current == $slug][0] ${seoPageFields}`;

export const seoPageSlugsByFamilyQuery = groq`*[_type == "seoPage" && family == $family]{ "slug": slug.current }`;

export const blogListQuery = groq`*[_type == "blogPost"] | order(publishedDate desc) {
  "slug": slug.current,
  title,
  description,
  publishedDate,
  updatedDate,
  category,
  readTime,
  bannerSrc,
  bannerAlt,
  "bannerUrl": banner.asset->url,
  "bannerHotspotAlt": banner.alt,
  keywords,
  featuredInLlms,
  highIntent
}`;

export const blogBySlugQuery = groq`*[_type == "blogPost" && slug.current == $slug][0] {
  "slug": slug.current,
  title,
  description,
  publishedDate,
  updatedDate,
  category,
  readTime,
  bannerSrc,
  bannerAlt,
  "bannerUrl": banner.asset->url,
  "bannerHotspotAlt": banner.alt,
  keywords,
  featuredInLlms,
  highIntent,
  body[]{
    ...,
    _type == "image" => {
      ...,
      alt,
      "src": asset->url
    }
  },
  faqItems[]{ question, answer }
}`;

export const blogSlugsQuery = groq`*[_type == "blogPost"]{ "slug": slug.current }`;

export const helpListQuery = groq`*[_type == "helpArticle"] | order(question asc) {
  "slug": slug.current,
  question,
  description,
  keywords,
  cluster,
  publishedDate,
  updatedDate,
  paragraphs,
  prompt,
  faqItems[]{ question, answer },
  relatedSlugs
}`;

export const helpBySlugQuery = groq`*[_type == "helpArticle" && slug.current == $slug][0] {
  "slug": slug.current,
  question,
  description,
  keywords,
  cluster,
  publishedDate,
  updatedDate,
  paragraphs,
  prompt,
  faqItems[]{ question, answer },
  relatedSlugs
}`;

export const guideListQuery = groq`*[_type == "guide"] | order(title asc) {
  "slug": slug.current,
  title,
  description,
  query,
  kicker,
  cluster,
  landingVariant,
  publishedDate,
  updatedDate,
  keywords,
  sections[]{ heading, paragraphs, bullets, code },
  faqItems[]{ question, answer },
  related[]{ label, href, description },
  relatedHeading
}`;

export const guideBySlugQuery = groq`*[_type == "guide" && slug.current == $slug][0] {
  "slug": slug.current,
  title,
  description,
  query,
  kicker,
  cluster,
  landingVariant,
  publishedDate,
  updatedDate,
  keywords,
  sections[]{ heading, paragraphs, bullets, code },
  faqItems[]{ question, answer },
  related[]{ label, href, description },
  relatedHeading
}`;

export const guideSlugsQuery = groq`*[_type == "guide"]{ "slug": slug.current }`;

export const legalBySlugQuery = groq`*[_type == "legalPage" && slug == $slug][0] {
  slug,
  title,
  description,
  lede,
  keywords,
  updatedDate,
  sections[]{ title, body }
}`;

export const legalListQuery = groq`*[_type == "legalPage"] {
  slug,
  title,
  description,
  lede,
  keywords,
  updatedDate,
  sections[]{ title, body }
}`;
