"use server";

import { db } from "@/db";
import { blogPosts, blogCategories, blogPostTags, users } from "@/db/schema";
import { eq, asc, desc, and, ilike, or, sql, SQL } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Redundant types removed as Drizzle handles inference

async function checkAdmin() {
  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user) return { isAdmin: false, error: "Unauthorized" };

  const dbUserQuery = await db.execute(
    sql`SELECT role FROM users WHERE id = ${user.id} LIMIT 1`
  );
  const dbUser = dbUserQuery.rows[0];

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

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (ch) => `\\${ch}`);
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
    const conditions: SQL[] = [];

    // Respect the published filter — defaults to true for public pages
    if (filters?.published !== undefined) {
      conditions.push(eq(blogPosts.published, filters.published));
    }

    if (filters?.categoryId) {
      conditions.push(eq(blogPosts.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      const safeSearch = escapeLike(filters.search);
      conditions.push(
        or(
          ilike(blogPosts.title, `%${safeSearch}%`),
          ilike(blogPosts.excerpt, `%${safeSearch}%`)
        ) as SQL
      );
    }

    const limit = Math.max(1, Math.min(Number(filters?.limit) || 100, 500));
    const offset = Math.max(0, Number(filters?.offset) || 0);

    const postsQuery = await db.execute(sql`
      SELECT
        blog_posts.id, blog_posts.title, blog_posts.slug, blog_posts.excerpt, blog_posts.content, blog_posts."imageUrl",
        blog_posts.published, blog_posts.featured, blog_posts.views, blog_posts."publishedAt",
        blog_posts."createdAt", blog_posts."updatedAt",
        blog_posts."categoryId", blog_posts."authorId",
        json_build_object('id', c.id, 'name', c.name) as category,
        json_build_object('id', u.id, 'email', u.email) as author,
        COALESCE(
          (SELECT json_agg(t."tagName") FROM blog_post_tags t WHERE t."postId" = blog_posts.id),
          '[]'::json
        ) as tags
      FROM blog_posts
      LEFT JOIN blog_categories c ON blog_posts."categoryId" = c.id
      LEFT JOIN users u ON blog_posts."authorId" = u.id
      ${conditions.length > 0 ? sql`WHERE ${and(...conditions)}` : sql``}
      ORDER BY blog_posts."createdAt" DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    // Parse JSON strings returned by json_build_object
    const mappedData = postsQuery.rows.map((row: any) => ({
      ...row,
      category: typeof row.category === 'string' ? JSON.parse(row.category) : row.category,
      author: typeof row.author === 'string' ? JSON.parse(row.author) : row.author,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
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
    const conditions = [eq(blogPosts.slug, slug)];
    // Only show published posts for public access
    conditions.push(eq(blogPosts.published, true));

    const postQuery = await db.execute(sql`
      SELECT
        blog_posts.id, blog_posts.title, blog_posts.slug, blog_posts.excerpt, blog_posts.content, blog_posts."imageUrl",
        blog_posts.published, blog_posts.featured, blog_posts.views, blog_posts."publishedAt",
        blog_posts."createdAt", blog_posts."updatedAt",
        blog_posts."categoryId", blog_posts."authorId",
        json_build_object('id', c.id, 'name', c.name) as category,
        json_build_object('id', u.id, 'email', u.email) as author,
        COALESCE(
          (SELECT json_agg(t."tagName") FROM blog_post_tags t WHERE t."postId" = blog_posts.id),
          '[]'::json
        ) as tags
      FROM blog_posts
      LEFT JOIN blog_categories c ON blog_posts."categoryId" = c.id
      LEFT JOIN users u ON blog_posts."authorId" = u.id
      ${conditions.length > 0 ? sql`WHERE ${and(...conditions)}` : sql``}
      LIMIT 1
    `);

    const post = postQuery.rows[0];

    if (!post) return { success: false, error: "Post not found" };

    // Parse JSON strings returned by json_build_object
    const parsedPost = {
      ...post,
      category: typeof post.category === 'string' ? JSON.parse(post.category) : post.category,
      author: typeof post.author === 'string' ? JSON.parse(post.author) : post.author,
      tags: typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags,
    };

    return {
      success: true,
      data: parsedPost,
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
 * Get a single blog post by ID (admin only)
 */
export async function getBlogPostByIdAction(postId: string) {
  try {
    const { isAdmin, error: adminError } = await checkAdmin();
    if (!isAdmin) return { success: false, error: adminError };

    const postQuery = await db.execute(sql`
      SELECT
        blog_posts.id, blog_posts.title, blog_posts.slug, blog_posts.excerpt, blog_posts.content, blog_posts."imageUrl",
        blog_posts.published, blog_posts.featured, blog_posts.views, blog_posts."publishedAt",
        blog_posts."createdAt", blog_posts."updatedAt",
        blog_posts."categoryId", blog_posts."authorId",
        json_build_object('id', c.id, 'name', c.name) as category,
        json_build_object('id', u.id, 'email', u.email) as author,
        COALESCE(
          (SELECT json_agg(t."tagName") FROM blog_post_tags t WHERE t."postId" = blog_posts.id),
          '[]'::json
        ) as tags
      FROM blog_posts
      LEFT JOIN blog_categories c ON blog_posts."categoryId" = c.id
      LEFT JOIN users u ON blog_posts."authorId" = u.id
      WHERE blog_posts.id = ${postId}
      LIMIT 1
    `);

    const post = postQuery.rows[0];

    if (!post) return { success: false, error: "Post not found" };

    // Parse JSON strings returned by json_build_object
    const parsedPost = {
      ...post,
      category: typeof post.category === 'string' ? JSON.parse(post.category) : post.category,
      author: typeof post.author === 'string' ? JSON.parse(post.author) : post.author,
      tags: typeof post.tags === 'string' ? JSON.parse(post.tags) : post.tags,
    };

    return {
      success: true,
      data: parsedPost,
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
    const categoriesQuery = await db.execute(sql`
      SELECT
        c.id,
        c.name,
        (SELECT count(*) FROM blog_posts bp WHERE bp."categoryId" = c.id AND bp.published = true) as count
      FROM blog_categories c
      ORDER BY c.name ASC
    `);

    const categoriesWithCount = categoriesQuery.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      _count: {
        posts: parseInt(row.count as string || "0", 10),
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
