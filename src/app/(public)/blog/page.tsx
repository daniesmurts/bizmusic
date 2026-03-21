import { getBlogPostsAction, getBlogCategoriesAction } from "@/lib/actions/blog";
import BlogClient from "./BlogClient";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  let initialPosts: any[] = [];
  let fetchedCategories: any[] = [];

  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Blog fetch timeout - 10s")), 10000);
    });

    const postsResult = await Promise.race([
      getBlogPostsAction({ published: true }),
      timeoutPromise
    ]) as any;

    if (postsResult?.success && postsResult?.data) {
      initialPosts = postsResult.data;
    }

    const categoriesResult = await getBlogCategoriesAction();

    if (categoriesResult?.success && categoriesResult?.data) {
      fetchedCategories = categoriesResult.data.map((cat: any) => ({
        name: cat.name || "Категория",
        count: cat._count?.posts || 0,
      }));
    }
  } catch (err: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Blog page error:", err?.message || err);
    }
  }

  const initialCategories = [
    { name: "Все", count: initialPosts.length },
    ...fetchedCategories
  ];

  return <BlogClient initialPosts={initialPosts} initialCategories={initialCategories} />;
}
