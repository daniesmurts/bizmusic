import { getBlogPostsAction, getBlogCategoriesAction } from "@/lib/actions/blog";
import BlogClient from "./BlogClient";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  console.log("SERVER: Fetching blog data...");
  const [postsResult, categoriesResult] = await Promise.all([
    getBlogPostsAction({ published: true }),
    getBlogCategoriesAction(),
  ]);

  if (postsResult.success) {
    console.log(`SERVER: Found ${postsResult.data?.length || 0} posts`);
  } else {
    console.error("SERVER: Failed to fetch posts:", postsResult.error);
  }

  const rawPosts = postsResult.success && Array.isArray(postsResult.data) ? postsResult.data : [];
  const initialPosts = rawPosts.map((post: any) => ({
    ...post,
    image: post.imageUrl || "/images/placeholder.png",
    author: {
      name: post.author?.email?.split('@')[0] || "Автор",
      avatar: "/images/author-1.png",
      role: post.category?.name || "Блог",
      email: post.author?.email || "",
    },
    readTime: Math.max(3, Math.ceil((post.content || "").split(' ').length / 200)),
    views: post.views || 0,
    comments: 0,
    publishedAt: post.publishedAt ? (post.publishedAt instanceof Date ? post.publishedAt.toISOString() : post.publishedAt) : null,
    category: {
      name: post.category?.name || "Блог"
    }
  }));

  const rawCategories = categoriesResult.success && Array.isArray(categoriesResult.data) ? categoriesResult.data : [];
  const fetchedCategories = rawCategories.map((cat: any) => ({
    name: cat.name || "Категория",
    count: cat._count?.posts || 0,
  }));

  const initialCategories = [
    { name: "Все", count: initialPosts.length },
    ...fetchedCategories
  ];

  return <BlogClient initialPosts={initialPosts} initialCategories={initialCategories} />;
}
