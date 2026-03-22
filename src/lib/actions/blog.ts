"use server";

import { db } from "@/db";
import { blogPosts, blogCategories, blogPostTags, users } from "@/db/schema";
import { eq, asc, desc, and, ilike, or, sql, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";



// Redundant types removed as Drizzle handles inference

async function checkAdmin() {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { isAdmin: false, error: "Unauthorized" };

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true }
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
    const { isAdmin } = await checkAdmin().catch(() => ({ isAdmin: false }));
    const conditions: SQL[] = [];

    // If not admin, always force published: true
    if (!isAdmin) {
      conditions.push(eq(blogPosts.published, true));
    } else if (filters?.published !== undefined) {
      conditions.push(eq(blogPosts.published, filters.published));
    }

    if (filters?.categoryId) {
      conditions.push(eq(blogPosts.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(blogPosts.title, `%${filters.search}%`),
          ilike(blogPosts.excerpt, `%${filters.search}%`)
        ) as SQL
      );
    }

    const posts = await db.query.blogPosts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(blogPosts.createdAt)],
      limit: filters?.limit,
      offset: filters?.offset,
      with: {
        category: true,
        author: {
          columns: {
            id: true,
            email: true,
          }
        },
        tags: true,
      },
    });

    const mappedData = posts.map((post) => ({
      ...post,
      tags: post.tags.map(t => t.tagName),
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
    const { isAdmin } = await checkAdmin().catch(() => ({ isAdmin: false }));
    
    const conditions = [eq(blogPosts.slug, slug)];
    if (!isAdmin) {
      conditions.push(eq(blogPosts.published, true));
    }

    const post = await db.query.blogPosts.findFirst({
      where: and(...conditions),
      with: {
        category: true,
        author: {
          columns: {
            id: true,
            email: true,
          }
        },
        tags: true,
      },
    });

    if (!post) return { success: false, error: "Post not found" };

    return {
      success: true,
      data: {
        ...post,
        tags: post.tags.map(t => t.tagName),
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
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, postId),
      with: {
        category: true,
        author: {
          columns: {
            id: true,
            email: true,
          }
        },
        tags: true,
      },
    });

    if (!post) return { success: false, error: "Post not found" };

    return {
      success: true,
      data: {
        ...post,
        tags: post.tags.map(t => t.tagName),
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
    const categories = await db.query.blogCategories.findMany({
      orderBy: [asc(blogCategories.name)],
      with: {
        posts: {
          columns: {
            id: true,
          },
        },
      },
    });

    const categoriesWithCount = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      _count: {
        posts: cat.posts.length,
      },
    }));

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

    const [post] = await db.insert(blogPosts).values({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      categoryId: data.categoryId,
      authorId: data.authorId,
      imageUrl: data.imageUrl,
      published: data.published || false,
      featured: data.featured || false,
      publishedAt: data.published ? new Date() : null,
    }).returning();

    // Add tags if provided
    if (data.tags && data.tags.length > 0) {
      const tagsToInsert = data.tags.map((tagName) => ({
        postId: post.id,
        tagName: tagName,
      }));
      await db.insert(blogPostTags).values(tagsToInsert);
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

    const updateData: Partial<typeof blogPosts.$inferInsert> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.published !== undefined) {
      updateData.published = data.published;
      if (data.published) updateData.publishedAt = new Date();
    }
    if (data.featured !== undefined) updateData.featured = data.featured;

    const [post] = await db.update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, postId))
      .returning();

    // Update tags if provided
    if (data.tags) {
      await db.delete(blogPostTags).where(eq(blogPostTags.postId, postId));
      if (data.tags.length > 0) {
        const tagsToInsert = data.tags.map((tagName) => ({
          postId: postId,
          tagName: tagName,
        }));
        await db.insert(blogPostTags).values(tagsToInsert);
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

    await db.delete(blogPosts).where(eq(blogPosts.id, postId));

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
