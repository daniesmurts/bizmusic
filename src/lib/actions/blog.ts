"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

// Sanitizes search input for PostgREST .or() query
function sanitizeSearch(query: string) {
  return query.replace(/[(),]/g, " ").trim();
}

interface BlogPostTag {
  tagName: string;
}

interface BlogCategory {
  id: string;
  name: string;
}

interface BlogAuthor {
  id: string;
  email: string;
}

interface RawBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  published: boolean;
  featured: boolean;
  views: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  authorId: string;
  category: BlogCategory | BlogCategory[] | null;
  author: BlogAuthor | BlogAuthor[] | null;
  tags: BlogPostTag[] | null;
}

async function checkAdmin() {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { isAdmin: false, error: "Unauthorized" };

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  });

  if (dbUser?.role !== "ADMIN") {
    return { isAdmin: false, error: "Forbidden: Admin access required" };
  }

  return { isAdmin: true, user, supabase };
}

export interface BlogPostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: string;
  authorId: string;
  imageUrl: string;
  published?: boolean;
  featured?: boolean;
  tags?: string[];
}

/**
 * Get all blog posts with filtering
 */
export async function getBlogPostsAction(filters?: {
  search?: string;
  categoryId?: string;
  published?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    let query = supabase
      .from("blog_posts")
      .select('id, title, slug, excerpt, content, "imageUrl", published, featured, views, "publishedAt", "createdAt", "updatedAt", "categoryId", "authorId", category:blog_categories(id, name), author:users(id, email), tags:blog_post_tags(tagName)')
      .order("createdAt", { ascending: false });

    if (filters?.published !== undefined) {
      query = query.eq("published", filters.published);
    }

    if (filters?.categoryId) {
      query = query.eq("categoryId", filters.categoryId);
    }

    if (filters?.search) {
      const sanitized = sanitizeSearch(filters.search);
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,excerpt.ilike.%${sanitized}%`);
      }
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;

    const mappedData = (data as RawBlogPost[] || []).map((post) => ({
      ...post,
      category: Array.isArray(post.category) ? post.category[0] : post.category,
      author: Array.isArray(post.author) ? post.author[0] : post.author,
      tags: post.tags?.map((t) => t.tagName) || [],
    }));

    return {
      success: true,
      data: mappedData,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch blog posts";
    console.error("Get blog posts error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlugAction(slug: string) {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        category:blog_categories (
          id,
          name
        ),
        author:users (
          id,
          email
        ),
        tags:blog_post_tags (
          tagName
        )
      `)
      .eq("slug", slug)
      .single();

    if (error) throw error;
    if (!post) return { success: false, error: "Post not found" };

    return {
      success: true,
      data: {
        ...post,
        category: Array.isArray(post.category) ? post.category[0] : post.category,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
        tags: (post as RawBlogPost).tags?.map((t) => t.tagName) || [],
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch blog post";
    console.error("Get blog post by slug error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostByIdAction(postId: string) {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    const { data: post, error } = await supabase
      .from("blog_posts")
      .select(`
        *,
        category:blog_categories (
          id,
          name
        ),
        author:users (
          id,
          email
        ),
        tags:blog_post_tags (
          tagName
        )
      `)
      .eq("id", postId)
      .single();

    if (error) throw error;
    if (!post) return { success: false, error: "Post not found" };

    return {
      success: true,
      data: {
        ...post,
        category: Array.isArray(post.category) ? post.category[0] : post.category,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
        tags: (post as RawBlogPost).tags?.map((t) => t.tagName) || [],
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch blog post";
    console.error("Get blog post error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get all blog categories
 */
export async function getBlogCategoriesAction() {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();

    const { data: categories, error } = await supabase
      .from("blog_categories")
      .select(`*`)
      .order("name", { ascending: true });

    if (error) {
      console.error("Supabase categories error:", error);
      throw error;
    }

    // Get post counts separately
    const categoriesWithCount = await Promise.all(
      (categories || []).map(async (cat) => {
        const { count } = await supabase
          .from("blog_posts")
          .select("*", { count: "exact", head: true })
          .eq("categoryId", cat.id);

        return {
          id: cat.id,
          name: cat.name,
          _count: {
            posts: count || 0,
          },
        };
      })
    );

    return {
      success: true,
      data: categoriesWithCount,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    console.error("Get categories error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Create a new blog post
 */
export async function createBlogPostAction(data: BlogPostInput) {
  try {
    const { isAdmin, error: adminError, supabase } = await checkAdmin();
    if (!isAdmin || !supabase) return { success: false, error: adminError };

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        categoryId: data.categoryId,
        authorId: data.authorId,
        imageUrl: data.imageUrl,
        published: data.published || false,
        featured: data.featured || false,
        publishedAt: data.published ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      const tagsToInsert = data.tags.map((tagName) => ({
        postId: post.id,
        tagName: tagName,
      }));
      await supabase.from("blog_post_tags").insert(tagsToInsert);
    }

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      success: true,
      data: {
        ...post,
        tags: data.tags || [],
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create blog post";
    console.error("Create blog post error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update an existing blog post
 */
export async function updateBlogPostAction(
  postId: string,
  data: Partial<BlogPostInput>
) {
  try {
    const { isAdmin, error: adminError, supabase } = await checkAdmin();
    if (!isAdmin || !supabase) return { success: false, error: adminError };

    const updateData: Partial<Record<string, string | boolean | null>> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.published !== undefined) {
      updateData.published = data.published;
      if (data.published) updateData.publishedAt = new Date().toISOString();
    }
    if (data.featured !== undefined) updateData.featured = data.featured;

    const { data: post, error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", postId)
      .select()
      .single();

    if (error) throw error;

    // Update tags if provided
    if (data.tags) {
      await supabase.from("blog_post_tags").delete().eq("postId", postId);
      if (data.tags.length > 0) {
        const tagsToInsert = data.tags.map((tagName) => ({
          postId: postId,
          tagName: tagName,
        }));
        await supabase.from("blog_post_tags").insert(tagsToInsert);
      }
    }

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      success: true,
      data: post,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update blog post";
    console.error("Update blog post error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPostAction(postId: string) {
  try {
    const { isAdmin, error: adminError, supabase } = await checkAdmin();
    if (!isAdmin || !supabase) return { success: false, error: adminError };

    // Delete tags first (cascade should handle this, but being explicit)
    await supabase.from("blog_post_tags").delete().eq("postId", postId);
    
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", postId);

    if (error) throw error;

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete blog post";
    console.error("Delete blog post error:", error);
    return {
      success: false,
      error: message,
    };
  }
}
