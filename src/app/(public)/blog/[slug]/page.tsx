"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BlogContent } from "@/components/BlogContent";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Tag,
  Bookmark,
  Share2,
  MessageCircle,
  Eye,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getBlogPostBySlugAction, getBlogPostsAction } from "@/lib/actions/blog";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    email: string;
    bio: string;
  };
  publishedAt: string | null;
  updatedAt: string | null;
  readTime: number;
  views: number;
  comments: number;
  category: {
    name: string;
  };
  imageUrl: string;
  tags: string[];
  published: boolean;
  featured: boolean;
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [postData, setPostData] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        const result = await getBlogPostBySlugAction(slug);
        if (result.success && result.data) {
          const post = result.data as any;
          setPostData({
            ...post,
            author: {
              name: post.author.email.split('@')[0],
              avatar: "/images/author-1.png",
              role: post.category.name,
              email: post.author.email,
              bio: `Официальный аккаунт команды ${post.category.name}. Мы делимся новостями, обновлениями и важной информацией.`,
            },
            readTime: Math.max(3, Math.ceil(post.content.split(' ').length / 200)),
            comments: 0,
            image: post.imageUrl,
          });

          // Fetch related posts from same category
          const relatedResult = await getBlogPostsAction({
            categoryId: post.categoryId,
            published: true,
            limit: 3,
          });

          if (relatedResult.success && relatedResult.data) {
            setRelatedPosts(
              relatedResult.data
                .filter((p: any) => p.id !== post.id)
                .slice(0, 3)
                .map((p: any) => ({
                  ...p,
                  image: p.imageUrl,
                  readTime: Math.max(3, Math.ceil(p.content.split(' ').length / 200)),
                }))
            );
          }
        } else {
          toast.error("Статья не найдена");
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        toast.error("Ошибка загрузки статьи");
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  const handleShare = (platform: string) => {
    toast.info(`Поделиться в ${platform}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Ссылка скопирована");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-neon/20 border-t-neon animate-spin mx-auto" />
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-sm">Загрузка статьи...</p>
        </div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Tag className="w-10 h-10 text-neutral-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Статья не найдена</h1>
            <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">Возможно, она была удалена или перемещена</p>
          </div>
          <Link href="/blog">
            <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-8 h-14 font-black uppercase tracking-widest">
              К статьям
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Back Button */}
      <div className="px-6 pt-6">
        <Link href="/blog">
          <Button
            variant="ghost"
            className="text-neutral-400 hover:text-white gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к статьям
          </Button>
        </Link>
      </div>

      {/* Article Header */}
      <header className="px-6 pt-8 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Category */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full bg-neon text-black text-xs font-black uppercase tracking-widest">
              {postData.category.name}
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {postData.publishedAt ? new Date(postData.publishedAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }) : "Не опубликовано"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {postData.readTime} мин
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-white">
            {postData.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-neutral-400 font-medium leading-relaxed">
            {postData.excerpt}
          </p>

          {/* Author & Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-neon/20 border border-neon/20 overflow-hidden">
                <Image
                  src={postData.author.avatar}
                  alt={postData.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-white font-black uppercase tracking-tight">
                  {postData.author.name}
                </p>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                  {postData.author.role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={cn(
                  "w-10 h-10 rounded-full border flex items-center justify-center transition-colors",
                  isBookmarked
                    ? "bg-neon border-neon text-black"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
                )}
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      <div className="px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="relative h-[400px] md:h-[500px] rounded-[3rem] overflow-hidden">
            <Image
              src={postData.imageUrl}
              alt={postData.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="px-6">
        <div className="max-w-4xl mx-auto">
          <BlogContent content={postData.content} />

          {/* Tags */}
          <div className="pt-12 mt-12 border-t border-white/5">
            <div className="flex items-center gap-3 flex-wrap">
              <Tag className="w-5 h-5 text-neutral-500" />
              {postData.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${tag}`}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition-colors text-sm font-bold uppercase tracking-widest"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Share Section */}
          <div className="pt-12 mt-12 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                Поделиться статьёй
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShare("Facebook")}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-[#1877F2] hover:border-[#1877F2] transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare("Twitter")}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-[#1DA1F2] hover:border-[#1DA1F2] transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleShare("LinkedIn")}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/20 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Author Bio */}
      <section className="px-6 mt-12">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[3rem] p-10">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-neon/20 border border-neon/20 overflow-hidden flex-shrink-0">
              <Image
                src={postData.author.avatar}
                alt={postData.author.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
                  {postData.author.name}
                </h3>
                <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                  {postData.author.role}
                </p>
              </div>
              <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                {postData.author.bio}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      <section className="px-6 mt-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-8">
            Читайте также
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {relatedPosts.length === 0 ? (
              <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest col-span-3 text-center py-12">
                Сопутствующие статьи не найдены
              </p>
            ) : (
              relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.02] hover:border-neon/30 transition-all duration-500"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover brightness-75 group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tighter text-white group-hover:text-neon transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {post.readTime} мин
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
