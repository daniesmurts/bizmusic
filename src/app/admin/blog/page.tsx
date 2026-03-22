"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getBlogPostsAction,
  deleteBlogPostAction,
  getBlogCategoriesAction,
} from "@/lib/actions/blog";
import { toast } from "sonner";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryId: string;
  authorId: string;
  imageUrl: string;
  published: boolean;
  featured: boolean;
  views: number;
  publishedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    email: string;
  };
  tags: string[];
}

export default function AdminBlogPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUnpublished, setShowUnpublished] = useState(false);

  // Fetch blog posts (no published filter — admin sees all)
  const { data: postsData } = useQuery({
    queryKey: ["admin-blog-posts", { search: searchQuery, categoryId: selectedCategory }],
    queryFn: async () => {
      const result = await getBlogPostsAction({
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
      });
      if (!result.success) throw new Error(result.error);
      return result.data as BlogPost[];
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: async () => {
      const result = await getBlogCategoriesAction();
      if (!result.success) throw new Error(result.error);
      return result.data as { id: string; name: string; _count: { posts: number } }[];
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const result = await deleteBlogPostAction(postId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Статья удалена");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = async (postId: string) => {
    const confirmed = confirm("Вы уверены, что хотите удалить эту статью?");
    if (confirmed) {
      await deletePostMutation.mutateAsync(postId);
    }
  };

  const handleTogglePublished = () => {
    setShowUnpublished(!showUnpublished);
  };

  const posts = postsData || [];
  const categories = categoriesData || [];

  const filteredPosts = showUnpublished
    ? posts
    : posts.filter((post) => post.published);

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-500">
            <BookOpen className="w-4 h-4 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Блог • Управление контентом
            </span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
            Управление <br />
            <span className="text-neon underline decoration-neon/20 underline-offset-8">
              Блогом
            </span>
          </h1>
        </div>

        <div className="flex gap-4">
          <Link href="/blog" target="_blank">
            <Button
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl h-14 px-6 font-black uppercase tracking-widest gap-2"
            >
              <Eye className="w-5 h-5" />
              Просмотр
            </Button>
          </Link>
          <Link href="/admin/blog/new">
            <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-8 h-14 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)] gap-3">
              <Plus className="w-5 h-5" />
              Добавить
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
            Всего статей
          </p>
          <p className="text-4xl font-black text-white">{posts.length}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
            Опубликованы
          </p>
          <p className="text-4xl font-black text-neon">
            {posts.filter((p) => p.published).length}
          </p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
            Черновики
          </p>
          <p className="text-4xl font-black text-orange-400">
            {posts.filter((p) => !p.published).length}
          </p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
            Избранные
          </p>
          <p className="text-4xl font-black text-purple-400">
            {posts.filter((p) => p.featured).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск статей..."
            className="pl-12 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-neutral-500" />
          <select
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="bg-white/[0.02] border border-white/10 text-white rounded-2xl h-14 px-6 text-sm font-bold uppercase tracking-widest"
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat._count.posts})
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleTogglePublished}
          variant="outline"
          className={cn(
            "rounded-2xl h-14 px-6 font-black uppercase tracking-widest gap-2",
            showUnpublished
              ? "bg-neon/10 border-neon/20 text-neon"
              : "bg-white/5 border-white/10 text-white"
          )}
        >
          {showUnpublished ? (
            <>
              <Eye className="w-5 h-5" />
              Все
            </>
          ) : (
            <>
              <EyeOff className="w-5 h-5" />
              Черновики
            </>
          )}
        </Button>
      </div>

      {/* Posts Table */}
      <div className="glass-dark border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Статья
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Категория
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Автор
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Статус
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Просмотры
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Дата
                </th>
                <th className="text-right py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-neutral-600" />
                      </div>
                      <div>
                        <p className="text-white font-black uppercase tracking-tight">
                          Статьи не найдены
                        </p>
                        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-1">
                          {searchQuery || selectedCategory
                            ? "Измените параметры поиска"
                            : "Создайте первую статью"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-black uppercase tracking-tight truncate max-w-[300px]">
                            {post.title}
                          </p>
                          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest truncate">
                            {post.slug}
                          </p>
                          {post.featured && (
                            <Badge className="mt-1 bg-purple-500/10 border-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest gap-1 flex items-center w-fit">
                              <Star className="w-3 h-3 fill-current" />
                              Избранное
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className="bg-white/5 border-white/10 text-neutral-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                        {post.category.name}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neon/20 border border-neon/20 overflow-hidden">
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-neon uppercase">
                            {post.author.email[0]}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-neutral-400">
                          {post.author.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {post.published ? (
                        <Badge className="bg-neon/10 border-neon/20 text-neon px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                          Опубликовано
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-500/10 border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                          Черновик
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-bold text-neutral-400">
                        {post.views.toLocaleString("ru-RU")}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-bold">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/blog/${post.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleDelete(post.id)}
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
