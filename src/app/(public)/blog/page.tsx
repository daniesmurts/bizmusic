import type { Metadata } from "next";
import { getBlogPostsAction, getBlogCategoriesAction } from "@/lib/actions/blog";
import BlogClient from "./BlogClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Блог | Бизнес Музыка",
  description:
    "Новости, обновления и полезные статьи о легальном музыкальном оформлении для бизнеса.",
  openGraph: {
    title: "Блог | Бизнес Музыка",
    description:
      "Новости и статьи о легальном музыкальном лицензировании для бизнеса в России.",
    type: "website",
  },
};

interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  published: boolean;
  featured: boolean;
  views: number;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  categoryId: string;
  authorId: string;
  category: { id: string; name: string } | null;
  author: { id: string; email: string } | null;
  tags: string[];
}

interface CategorySummary {
  name: string;
  count: number;
}

export default async function BlogPage() {
  let initialPosts: BlogPostSummary[] = [];
  let fetchedCategories: CategorySummary[] = [];

  try {
    const postsResult = await getBlogPostsAction({ published: true });

    if (postsResult?.success && postsResult?.data) {
      initialPosts = postsResult.data;
    }
  } catch (err: unknown) {
    console.error("Blog page posts error:", err instanceof Error ? err.message : err);
  }

  try {
    const categoriesResult = await getBlogCategoriesAction();

    if (categoriesResult?.success && categoriesResult?.data) {
      fetchedCategories = categoriesResult.data.map((cat) => ({
        name: cat.name || "Категория",
        count: cat._count?.posts || 0,
      }));
    }
  } catch (err: unknown) {
    console.error("Blog page categories error:", err instanceof Error ? err.message : err);
  }

  const totalCount = fetchedCategories.reduce((sum, cat) => sum + cat.count, 0);
  const initialCategories = [
    { name: "Все", count: totalCount },
    ...fetchedCategories
  ];

  return <BlogClient initialPosts={initialPosts} initialCategories={initialCategories} />;
}
