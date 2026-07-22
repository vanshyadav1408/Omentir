import type { Metadata } from "next";
import { ALL_BLOGS } from "./blogs/blog-data";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://omentir.com").replace(/\/$/, "");

export const defaultDescription =
  "Omentir helps founders and sales teams find potential customers, personalize LinkedIn outreach, and turn interested replies into booked demos.";

export const defaultOgImage = {
  url: "/omentir-og.png",
  width: 1200,
  height: 630,
  alt: "Find your next 10 customers while you sleep",
  type: "image/png",
};

export const defaultKeywords = [
  "Omentir",
  "AI sales outreach",
  "LinkedIn outreach",
  "LinkedIn lead generation",
  "AI sales agents",
  "AI SDR",
  "autonomous sales agent",
  "B2B sales automation",
  "outbound sales software",
  "personalized outbound",
  "sales prospecting software",
];

export const noIndexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

export const indexRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

type PageMetadataOptions = {
  title: string;
  description: string;
  path?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  keywords?: string[];
  image?: {
    url: string;
    width: number;
    height: number;
    alt: string;
  };
};

function normalizeDate(value: string) {
  const parsedDate = new Date(value);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split("T")[0];
  }

  return value;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getBlogForPath(path: string) {
  if (!path.startsWith("/blogs/")) {
    return undefined;
  }

  const slug = path.replace(/^\/blogs\//, "").replace(/\/$/, "");
  return ALL_BLOGS.find((blog) => blog.slug === slug);
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  canonicalPath = path,
  noIndex = false,
  keywords = [],
  image = defaultOgImage,
}: PageMetadataOptions): Metadata {
  const url = `${siteUrl}${path}`;
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const blog = getBlogForPath(path);
  const metadataImage = blog && image === defaultOgImage
    ? {
        url: blog.bannerSrc,
        width: 1200,
        height: 600,
        alt: blog.bannerAlt,
      }
    : image;
  const articleKeywords = blog
    ? [
        blog.title,
        blog.category,
        `${blog.category} for B2B sales`,
        `${blog.title} Omentir`,
      ]
    : [];
  const allKeywords = uniqueValues([...defaultKeywords, ...keywords, ...articleKeywords]);

  const openGraph = blog
    ? {
        title,
        description,
        url,
        siteName: "Omentir",
        type: "article" as const,
        publishedTime: normalizeDate(blog.publishedDate),
        modifiedTime: normalizeDate(blog.updatedDate || blog.publishedDate),
        authors: ["Vansh Yadav"],
        section: blog.category,
        tags: uniqueValues([...keywords, blog.title, blog.category]),
        images: [metadataImage],
      }
    : {
        title,
        description,
        url,
        siteName: "Omentir",
        type: "website" as const,
        images: [metadataImage],
      };

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: allKeywords,
    authors: blog ? [{ name: "Vansh Yadav", url: `${siteUrl}/about` }] : [{ name: "Omentir" }],
    creator: "Omentir",
    publisher: "Omentir",
    category: blog?.category,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "en-US": canonicalUrl,
      },
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [metadataImage.url],
    },
    robots: noIndex ? noIndexRobots : indexRobots,
  };
}

export const founderJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${siteUrl}/about#vansh-yadav`,
  name: "Vansh Yadav",
  url: `${siteUrl}/about`,
  image: `${siteUrl}/founder.jpg`,
  jobTitle: "Founder",
  worksFor: {
    "@id": `${siteUrl}/#organization`,
  },
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "Omentir",
  description: defaultDescription,
  url: siteUrl,
  logo: `${siteUrl}/omentir-logo.png`,
  founder: {
    "@id": `${siteUrl}/about#vansh-yadav`,
  },
  sameAs: [
    "https://www.linkedin.com/company/121943897",
    "https://x.com/OmentirAI",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: process.env.HOSTED_CONTACT_EMAIL?.trim() || "vansh@omentir.com",
  },
  knowsAbout: [
    "AI sales outreach",
    "LinkedIn lead generation",
    "B2B outbound sales",
    "AI SDR software",
    "sales prospecting",
  ],
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: "Omentir",
  alternateName: "Omentir AI",
  url: siteUrl,
  description: defaultDescription,
  inLanguage: "en-US",
  publisher: {
    "@id": `${siteUrl}/#organization`,
  },
};

export const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": `${siteUrl}/#software`,
  name: "Omentir",
  alternateName: [
    "Omentir AI sales agent",
    "Omentir AI SDR",
    "Omentir LinkedIn outreach tool",
  ],
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: siteUrl,
  description: defaultDescription,
  inLanguage: "en-US",
  audience: {
    "@type": "Audience",
    audienceType: "B2B founders, SDRs, solo operators, and small sales teams",
  },
  featureList: [
    "AI-assisted LinkedIn outreach",
    "Buyer discovery",
    "Lead organization",
    "Campaign copy generation",
    "Reply tracking",
    "Unified sales inbox",
  ],
  creator: {
    "@id": `${siteUrl}/#organization`,
  },
  offers: [
    {
      "@type": "Offer",
      name: "Basic plan",
      price: "29",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/pricing`,
    },
    {
      "@type": "Offer",
      name: "Startup plan",
      price: "59",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/pricing`,
    },
  ],
};

type BlogJsonLdOptions = {
  title: string;
  description: string;
  url: string;
  publishedDate: string;
  modifiedDate?: string;
  authorName: string;
  section?: string;
  images?: string[];
};

export function createBlogJsonLd({
  title,
  description,
  url,
  publishedDate,
  modifiedDate,
  authorName,
  section,
  images = [],
}: BlogJsonLdOptions) {
  const formattedPublishedDate = normalizeDate(publishedDate);
  const formattedModifiedDate = normalizeDate(modifiedDate || publishedDate);
  const path = url.startsWith(siteUrl) ? url.slice(siteUrl.length) : url;
  const blog = getBlogForPath(path);
  const keywords = uniqueValues([
    ...(blog ? [blog.title, blog.category, `${blog.category} for B2B sales`] : []),
    ...defaultKeywords,
  ]);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    headline: title,
    description: description,
    inLanguage: "en-US",
    ...(section ? { articleSection: section } : {}),
    keywords,
    image: images,
    ...(images[0] ? { thumbnailUrl: images[0] } : {}),
    datePublished: formattedPublishedDate,
    dateModified: formattedModifiedDate,
    author: {
      "@type": "Person",
      "@id": `${siteUrl}/about#vansh-yadav`,
      name: authorName,
      url: `${siteUrl}/about`,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Omentir",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/omentir-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    isPartOf: {
      "@id": `${siteUrl}/blogs#collection`,
    },
  };
}

export function createBlogCollectionJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteUrl}/blogs#collection`,
    name: "The Omentir Library",
    description:
      "Tactical B2B outreach guides, LinkedIn sales playbooks, AI SDR comparisons, and outbound automation resources from Omentir.",
    url: `${siteUrl}/blogs`,
    inLanguage: "en-US",
    isPartOf: {
      "@id": `${siteUrl}/#website`,
    },
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: ALL_BLOGS.length,
      itemListElement: ALL_BLOGS.map((blog, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${siteUrl}/blogs/${blog.slug}`,
        name: blog.title,
      })),
    },
  };
}

export function createBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function createFAQJsonLd(
  items: ReadonlyArray<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
