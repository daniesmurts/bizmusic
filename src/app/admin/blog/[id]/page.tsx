"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Save,
  X,
  Image as ImageIcon,
  Tag as TagIcon,
  Star,
  Eye,
  EyeOff,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  getBlogPostByIdAction,
  createBlogPostAction,
  updateBlogPostAction,
  getBlogCategoriesAction,
} from "@/lib/actions/blog";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

export default function AdminBlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const postId = params.id as string | undefined;
  const isEdit = !!postId;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);

  // Fetch post if editing
  const { data: postData } = useQuery({
    queryKey: ["admin-blog-post", postId],
    queryFn: async () => {
      if (!postId) return null;
      const result = await getBlogPostByIdAction(postId);
      if (!result.success) throw new Error(result.error);
      return result.data as any;
    },
    enabled: isEdit,
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["admin-blog-categories"],
    queryFn: async () => {
      const result = await getBlogCategoriesAction();
      if (!result.success) throw new Error(result.error);
      return result.data as { id: string; name: string }[];
    },
  });

  // Load post data when editing
  useEffect(() => {
    if (postData) {
      setTitle(postData.title);
      setSlug(postData.slug);
      setExcerpt(postData.excerpt);
      setContent(postData.content);
      setCategoryId(postData.categoryId);
      setImageUrl(postData.imageUrl);
      setTags(postData.tags || []);
      setPublished(postData.published);
      setFeatured(postData.featured);
    }
  }, [postData]);

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit && postId) {
        return await updateBlogPostAction(postId, data);
      } else {
        return await createBlogPostAction({
          ...data,
          authorId: user?.id || "",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success(isEdit ? "Статья обновлена" : "Статья создана");
      router.push("/admin/blog");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Введите название статьи");
      return;
    }
    if (!slug.trim()) {
      toast.error("Введите URL статьи");
      return;
    }
    if (!excerpt.trim()) {
      toast.error("Введите краткое описание");
      return;
    }
    if (!content.trim()) {
      toast.error("Введите содержание статьи");
      return;
    }
    if (!categoryId) {
      toast.error("Выберите категорию");
      return;
    }

    saveMutation.mutate({
      title,
      slug,
      excerpt,
      content,
      categoryId,
      imageUrl: imageUrl || "/images/mood-1.png",
      published,
      featured,
      tags,
    });
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const generateSlug = () => {
    const slug = title
      .toLowerCase()
      .replace(/[^а-яa-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setSlug(slug);
  };

  const categories = categoriesData || [];

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-500">
            <BookOpen className="w-4 h-4 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isEdit ? "Редактирование" : "Новая статья"}
            </span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
            {isEdit ? "Изменить статью" : "Создать статью"}
          </h1>
        </div>

        <div className="flex gap-4">
          <Link href="/admin/blog">
            <Button
              variant="outline"
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl h-14 px-6 font-black uppercase tracking-widest gap-2"
            >
              <X className="w-5 h-5" />
              Отмена
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-8 h-14 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)] gap-3 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-8">
          {/* Title & Slug */}
          <div className="space-y-6">
            <div>
              <Label className="text-white font-black uppercase tracking-widest text-xs">
                Название статьи *
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={generateSlug}
                placeholder="Например: Как легально использовать музыку в бизнесе"
                className="mt-2 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6 text-lg"
              />
            </div>

            <div>
              <Label className="text-white font-black uppercase tracking-widest text-xs">
                URL статьи (slug) *
              </Label>
              <div className="relative mt-2">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="kak-legalno-ispolzovat-muzyku"
                  className="pl-12 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <Label className="text-white font-black uppercase tracking-widest text-xs">
              Краткое описание *
            </Label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Краткое описание статьи для превью (2-3 предложения)"
              rows={3}
              className="mt-2 w-full bg-white/[0.02] border border-white/10 text-white rounded-2xl p-6 resize-none focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all"
            />
          </div>

          {/* Content */}
          <div>
            <Label className="text-white font-black uppercase tracking-widest text-xs">
              Содержание статьи *
            </Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Полный текст статьи (поддерживается Markdown)"
              rows={20}
              className="mt-2 w-full bg-white/[0.02] border border-white/10 text-white rounded-2xl p-6 resize-y focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all font-mono text-sm"
            />
            <p className="mt-2 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Используйте ## для заголовков, **текст** для жирного, - для списков
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Publish Settings */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-6 space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              Публикация
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {published ? (
                  <Eye className="w-5 h-5 text-neon" />
                ) : (
                  <EyeOff className="w-5 h-5 text-neutral-500" />
                )}
                <div>
                  <p className="text-white font-black uppercase tracking-tight text-sm">
                    {published ? "Опубликовано" : "Черновик"}
                  </p>
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                    {published
                      ? "Видно всем"
                      : "Видно только вам"}
                  </p>
                </div>
              </div>
              <Switch
                checked={published}
                onCheckedChange={setPublished}
                className="data-[state=checked]:bg-neon"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star
                  className={cn(
                    "w-5 h-5",
                    featured ? "text-purple-400 fill-purple-400" : "text-neutral-500"
                  )}
                />
                <div>
                  <p className="text-white font-black uppercase tracking-tight text-sm">
                    Избранное
                  </p>
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                    Показывать на главной
                  </p>
                </div>
              </div>
              <Switch
                checked={featured}
                onCheckedChange={setFeatured}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
          </div>

          {/* Category */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-6 space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              Категория
            </h3>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 text-white rounded-2xl h-14 px-6 text-sm font-bold uppercase tracking-widest"
            >
              <option value="">Выбрать категорию</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Image URL */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-6 space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-neutral-400" />
              Обложка
            </h3>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/images/mood-1.png"
              className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6 font-mono text-sm"
            />
            {imageUrl && (
              <div className="relative h-32 rounded-xl overflow-hidden border border-white/10">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-6 space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-neutral-400" />
              Теги
            </h3>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Добавить тег"
                className="bg-white/[0.02] border-white/10 text-white rounded-2xl h-12 px-4 flex-1"
              />
              <Button
                onClick={handleAddTag}
                className="bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 w-12 p-0"
              >
                +
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-neon/10 border border-neon/20 text-neon px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest gap-2 flex items-center"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-neon/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
