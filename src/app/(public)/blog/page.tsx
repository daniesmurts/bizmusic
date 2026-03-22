import { getBlogPostsAction, getBlogCategoriesAction } from "@/lib/actions/blog";
import BlogClient from "./BlogClient";

export const dynamic = "force-dynamic";

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
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Blog fetch timeout - 10s")), 10000);
    });

    const postsResult = await Promise.race([
      getBlogPostsAction({ published: true }),
      timeoutPromise
    ]) as Awaited<ReturnType<typeof getBlogPostsAction>>;

    if (postsResult?.success && postsResult?.data) {
      initialPosts = postsResult.data;
    }

    const categoriesResult = await getBlogCategoriesAction();

    if (categoriesResult?.success && categoriesResult?.data) {
      fetchedCategories = categoriesResult.data.map((cat) => ({
        name: cat.name || "Категория",
        count: cat._count?.posts || 0,
      }));
    }
  } catch (err: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.error("Blog page error:", err instanceof Error ? err.message : err);
    }
  }

  const initialCategories = [
    { name: "Все", count: initialPosts.length },
    ...fetchedCategories
  ];

  return <BlogClient initialPosts={initialPosts} initialCategories={initialCategories} />;
}
