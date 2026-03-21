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

    console.log("Blog posts result:", postsResult);

    if (postsResult?.success && postsResult?.data) {
      console.log("Found posts:", postsResult.data.length);
      console.log("First post imageUrl:", postsResult.data[0]?.imageUrl);
      initialPosts = postsResult.data;
    } else {
      console.log("No posts data or not successful", postsResult);
    }

    const categoriesResult = await getBlogCategoriesAction();
    console.log("Categories result:", categoriesResult);

    if (categoriesResult?.success && categoriesResult?.data) {
      console.log("Found categories:", categoriesResult.data.length);
      fetchedCategories = categoriesResult.data.map((cat: any) => ({
        name: cat.name || "Категория",
        count: cat._count?.posts || 0,
      }));
    }
  } catch (err: any) {
    console.error("Blog page error:", err?.message || err);
  }

  console.log("Final posts count:", initialPosts.length);
  console.log("Final categories count:", fetchedCategories.length);

  const initialCategories = [
    { name: "Все", count: initialPosts.length },
    ...fetchedCategories
  ];

  return <BlogClient initialPosts={initialPosts} initialCategories={initialCategories} />;
}
