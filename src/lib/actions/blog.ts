"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
 * Get all blog posts with optional filtering
 */
export async function getBlogPostsAction(filters?: {
  search?: string;
  categoryId?: string;
  published?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { excerpt: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.published !== undefined) {
      where.published = filters.published;
    }

    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: {
          select: {
            tagName: true,
          },
        },
        _count: {
          select: {
            tags: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
    });
    console.log("Get blog posts success, count:", posts.length);

    return {
      success: true,
      data: posts.map((post) => ({
        ...post,
        tags: post.tags.map((t) => t.tagName),
      })),
    };
  } catch (error: any) {
    console.error("Get blog posts error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch blog posts",
    };
  }
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostByIdAction(postId: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: postId },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: {
          select: {
            tagName: true,
          },
        },
      },
    });

    if (!post) {
      return {
        success: false,
        error: "Post not found",
      };
    }

    return {
      success: true,
      data: {
        ...post,
        tags: post.tags.map((t) => t.tagName),
      },
    };
  } catch (error: any) {
    console.error("Get blog post error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch blog post",
    };
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPostBySlugAction(slug: string) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: {
          select: {
            tagName: true,
          },
        },
      },
    });

    if (!post) {
      return {
        success: false,
        error: "Post not found",
      };
    }

    return {
      success: true,
      data: {
        ...post,
        tags: post.tags.map((t) => t.tagName),
      },
    };
  } catch (error: any) {
    console.error("Get blog post by slug error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch blog post",
    };
  }
}

/**
 * Create a new blog post
 */
export async function createBlogPostAction(data: BlogPostInput) {
  try {
    const post = await prisma.blogPost.create({
      data: {
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
        tags: data.tags?.length
          ? {
              create: data.tags.map((tagName) => ({ tagName })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: true,
      },
    });

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      success: true,
      data: post,
    };
  } catch (error: any) {
    console.error("Create blog post error:", error);
    return {
      success: false,
      error: error.message || "Failed to create blog post",
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
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.published !== undefined) {
      updateData.published = data.published;
      if (data.published) {
        updateData.publishedAt = new Date();
      }
    }
    if (data.featured !== undefined) updateData.featured = data.featured;

    // Handle tags
    if (data.tags) {
      // Delete existing tags
      updateData.tags = {
        deleteMany: {},
        create: data.tags.map((tagName: string) => ({ tagName })),
      };
    }

    const post = await prisma.blogPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        category: true,
        tags: true,
      },
    });

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      success: true,
      data: post,
    };
  } catch (error: any) {
    console.error("Update blog post error:", error);
    return {
      success: false,
      error: error.message || "Failed to update blog post",
    };
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPostAction(postId: string) {
  try {
    await prisma.blogPost.delete({
      where: { id: postId },
    });

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Delete blog post error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete blog post",
    };
  }
}

/**
 * Get all blog categories
 */
export async function getBlogCategoriesAction() {
  try {
    const categories = await prisma.blogCategory.findMany({
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      success: true,
      data: categories,
    };
  } catch (error: any) {
    console.error("Get categories error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch categories",
    };
  }
}

/**
 * Create a new blog category
 */
export async function createBlogCategoryAction(name: string) {
  try {
    const category = await prisma.blogCategory.create({
      data: { name },
    });

    revalidatePath("/admin/blog");

    return {
      success: true,
      data: category,
    };
  } catch (error: any) {
    console.error("Create category error:", error);
    return {
      success: false,
      error: error.message || "Failed to create category",
    };
  }
}

/**
 * Delete a blog category
 */
export async function deleteBlogCategoryAction(categoryId: string) {
  try {
    await prisma.blogCategory.delete({
      where: { id: categoryId },
    });

    revalidatePath("/admin/blog");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Delete category error:", error);
    return {
      success: false,
      error: error.message || "Failed to delete category",
    };
  }
}

/**
 * Get unique tags from all posts
 */
export async function getAllBlogTagsAction() {
  try {
    const tags = await prisma.blogPostTag.groupBy({
      by: ["tagName"],
      _count: {
        tagName: true,
      },
      orderBy: {
        _count: {
          tagName: "desc",
        },
      },
    });

    return {
      success: true,
      data: tags.map((t) => ({
        name: t.tagName,
        count: t._count.tagName,
      })),
    };
  } catch (error: any) {
    console.error("Get tags error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch tags",
    };
  }
}
