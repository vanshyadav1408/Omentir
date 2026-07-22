import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import BlogPostContent from "./post-content";

export const metadata = createPageMetadata({
  title: "How to Write a LinkedIn Connection Request That Gets Accepted - Omentir",
  description: "Discover the exact rules of high-converting LinkedIn outreach. Master personalization, avoid common spam triggers, and use copy templates that double connection acceptance rates.",
  path: "/blogs/how-to-write-a-linkedin-connection-request-that-gets-accepted",
  image: {
    url: "/how-to-write-a-linkedin-connection-request-that-gets-accepted.avif",
    width: 1774,
    height: 887,
    alt: "LinkedIn Connection Request guide banner",
  },
  keywords: [
    "LinkedIn connection request template",
    "LinkedIn cold outreach",
    "B2B sales templates",
    "personalized LinkedIn outreach",
  ],
});

const tocItems = [
  { id: "physics-of-acceptance", label: "Pillars of Acceptance", level: 1 },
  { id: "pillar-mutual-context", label: "Mutual Context", level: 2 },
  { id: "pillar-friction-reduction", label: "Absolute Friction Reduction", level: 2 },
  { id: "pillar-intent-alignment", label: "Professional Intent Alignment", level: 2 },
  { id: "four-crucial-mistakes", label: "Four Crucial Mistakes", level: 1 },
  { id: "mistake-compliment", label: "Superficial Compliment", level: 2 },
  { id: "mistake-pitching", label: "Pitching Too Early", level: 2 },
  { id: "mistake-length", label: "Excessive Length", level: 2 },
  { id: "mistake-vague", label: "Vague Networking Requests", level: 2 },
  { id: "personalization-blueprint", label: "Personalization Blueprint", level: 1 },
  { id: "connection-templates", label: "6 Connection Templates", level: 1 },
  { id: "managing-limits", label: "Limits & Profile Safety", level: 1 },
  { id: "concluding-takeaways", label: "Outbound Takeaways", level: 1 },
] as const;

export default function BlogPost() {
  return (
    <BlogPostTemplate
      title="How to Write a LinkedIn Connection Request That Gets Accepted"
      description="Discover the exact rules of high-converting LinkedIn outreach. Master personalization, avoid common spam triggers, and use copy templates that double connection acceptance rates."
      slug="how-to-write-a-linkedin-connection-request-that-gets-accepted"
      publishedDate="June 13, 2026"
      updatedDate="June 13, 2026"
      bannerSrc="/how-to-write-a-linkedin-connection-request-that-gets-accepted.avif"
      bannerAlt="LinkedIn Connection Request outreach concept art"
      tocItems={tocItems as any}
    >
      <BlogPostContent />
    </BlogPostTemplate>
  );
}
