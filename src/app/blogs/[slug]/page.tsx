import { notFound } from "next/navigation";
import { createPageMetadata } from "../../seo";
import BlogPostTemplate from "../blog-post-template";
import { getBlog, getBlogSlugs, getLiveBlogs, isBlogLive } from "@/lib/cms";
import { BlogPortableText } from "@/lib/cms/portable-text";
import { tocFromBody, withoutFaqHeadings } from "@/lib/cms/portable-text-toc";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlog(slug);
  if (!post) {
    return createPageMetadata({
      title: "Not found - Omentir",
      description: "This page does not exist.",
      path: `/blogs/${slug}`,
      noIndex: true,
    });
  }
  return createPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blogs/${post.slug}`,
    keywords: post.keywords,
    noIndex: !isBlogLive(post),
    image: post.bannerSrc
      ? {
          url: post.bannerSrc,
          width: 1200,
          height: 600,
          alt: post.bannerAlt,
        }
      : undefined,
    article: {
      publishedDate: post.publishedDate,
      updatedDate: post.updatedDate,
      category: post.category,
    },
  });
}

export default async function CmsBlogPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlog(slug);
  if (!post?.body?.length) notFound();
  const body = post.faqItems.length ? withoutFaqHeadings(post.body) : post.body;
  const tocItems = tocFromBody(body);
  if (post.faqItems.length) {
    tocItems.push({ id: "faqs", label: "Frequently asked questions", level: 1 });
  }
  const relatedPosts = (await getLiveBlogs())
    .filter((blog) => blog.slug !== post.slug)
    .sort((left, right) => {
      const leftSame = left.category === post.category ? 0 : 1;
      const rightSame = right.category === post.category ? 0 : 1;
      return leftSame - rightSame;
    })
    .slice(0, 4)
    .map((blog) => ({ slug: blog.slug, title: blog.title }));
  return (
    <BlogPostTemplate
      title={post.title}
      description={post.description}
      slug={post.slug}
      bannerSrc={post.bannerSrc}
      bannerAlt={post.bannerAlt}
      tocItems={tocItems}
      faqItems={post.faqItems}
      publishedDate={post.publishedDate}
      updatedDate={post.updatedDate}
      category={post.category}
      relatedPosts={relatedPosts}
    >
      <BlogPortableText value={body} />
    </BlogPostTemplate>
  );
}
