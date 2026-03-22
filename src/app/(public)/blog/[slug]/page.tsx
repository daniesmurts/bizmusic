import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPostBySlugAction, getBlogPostsAction } from "@/lib/actions/blog";
import BlogPostClient from "./BlogPostClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getBlogPostBySlugAction(slug);

  if (!result.success || !result.data) {
    return { title: "Статья не найдена" };
  }

  const post = result.data;
  return {
    title: `${post.title} | Блог BizMusic`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      images: post.imageUrl ? [{ url: post.imageUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getBlogPostBySlugAction(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const raw = result.data;

  const post = {
    id: raw.id as string,
    title: raw.title as string,
    slug: raw.slug as string,
    excerpt: raw.excerpt as string,
    content: raw.content as string,
    imageUrl: raw.imageUrl as string,
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : null,
    views: (raw.views as number) || 0,
    tags: (raw.tags as string[]) || [],
    readTime: Math.max(3, Math.ceil(((raw.content as string) || "").split(" ").length / 200)),
    category: { name: (raw.category as any)?.name || "Блог" },
    author: {
      name: (raw.author as any)?.email?.split("@")[0] || "Автор",
      avatar: "/images/author-1.png",
      role: (raw.category as any)?.name || "Блог",
      bio: `Официальный аккаунт команды ${(raw.category as any)?.name || "BizMusic"}. Мы делимся новостями, обновлениями и важной информацией.`,
    },
  };

  // Fetch related posts
  let relatedPosts: { id: string; title: string; slug: string; imageUrl: string; readTime: number }[] = [];
  try {
    const relatedResult = await getBlogPostsAction({
      categoryId: raw.categoryId as string,
      published: true,
      limit: 4,
    });
    if (relatedResult.success && relatedResult.data) {
      relatedPosts = relatedResult.data
        .filter((p: any) => p.id !== raw.id)
        .slice(0, 3)
        .map((p: any) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          imageUrl: p.imageUrl || "/images/placeholder.png",
          readTime: Math.max(3, Math.ceil((p.content || "").split(" ").length / 200)),
        }));
    }
  } catch {
    // Related posts are non-critical
  }

  return <BlogPostClient post={post} relatedPosts={relatedPosts} />;
}
