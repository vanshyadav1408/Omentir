import Link from "next/link";

export type BlogCardData = {
  slug: string;
  title: string;
  description?: string;
  category: string;
  date: string;
};

/** Text-only post card (no art tile): category and date, then the title and
 *  summary under a hairline rule, the way nextrip.cc lists its sections.
 *  `featured` is the larger row that opens the blog index. */
export default function BlogCard({ post, featured = false }: { post: BlogCardData; featured?: boolean }) {
  return (
    <Link href={`/blogs/${post.slug}`} className={featured ? "cal-post-featured" : "cal-post-card"}>
      <span className="cal-post-body">
        <span className="cal-post-meta">
          <span className="cal-post-tag">{post.category}</span>
          {post.date}
        </span>
        <strong>{post.title}</strong>
        {post.description ? <span className="cal-post-summary">{post.description}</span> : null}
      </span>
    </Link>
  );
}
