"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BlogContent } from "@/components/BlogContent";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Bookmark,
  Share2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    bio: string;
  };
  publishedAt: string | null;
  readTime: number;
  views: number;
  category: { name: string };
  imageUrl: string;
  tags: string[];
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  imageUrl: string;
  readTime: number;
}

interface BlogPostClientProps {
  post: BlogPostData;
  relatedPosts: RelatedPost[];
}

export default function BlogPostClient({ post, relatedPosts }: BlogPostClientProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Ссылка скопирована");
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Не опубликовано";
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="pb-20 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-neon/15 blur-[150px] rounded-full -mr-96 -mt-96 pointer-events-none z-0" />
      <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-purple-500/10 blur-[150px] rounded-full -ml-32 pointer-events-none z-0" />
      <div className="absolute top-3/4 right-0 w-[600px] h-[600px] bg-teal-500/10 blur-[150px] rounded-full -mr-32 pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[900px] h-[900px] bg-blue-500/10 blur-[150px] rounded-full -ml-64 pointer-events-none z-0" />
      
      {/* Content wrapper */}
      <div className="relative z-10">
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
              {post.category.name}
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {formatDate(post.publishedAt)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {post.readTime} мин
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-white">
            {post.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-neutral-400 font-medium leading-relaxed">
            {post.excerpt}
          </p>

          {/* Author & Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center">
                {post.author.avatar ? (
                  <Image
                    src={post.author.avatar}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-lg font-black text-neon">А</span>
                )}
              </div>
              <div>
                <p className="text-white font-black uppercase tracking-tight">
                  {post.author.name}
                </p>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                  {post.author.role}
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
              <button 
                onClick={handleCopyLink}
                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-neon transition-colors"
                title="Копировать ссылку"
              >
                <Copy className="w-5 h-5" />
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
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="px-6">
        <div className="max-w-4xl mx-auto">
          <BlogContent content={post.content} />

          {/* Tags */}
          <div className="pt-12 mt-12 border-t border-white/5">
            <div className="flex items-center gap-3 flex-wrap">
              <Tag className="w-5 h-5 text-neutral-500" />
              {post.tags.map((tag) => (
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
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCopyLink}
                  className="bg-white/5 border border-white/10 text-neutral-400 hover:text-neon hover:border-neon/50 uppercase font-black text-xs tracking-widest px-8 rounded-2xl h-14 flex items-center gap-3"
                >
                  <Copy className="w-5 h-5" />
                  Копировать ссылку
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Author Bio */}
      <section className="px-6 mt-12">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[3rem] p-10">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative w-20 h-20 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center flex-shrink-0">
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-neon">А</span>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
                  {post.author.name}
                </h3>
                <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                  {post.author.role}
                </p>
              </div>
              <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                {post.author.bio}
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
              relatedPosts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.02] hover:border-neon/30 transition-all duration-500"
                >
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={rp.imageUrl || "/images/placeholder.png"}
                      alt={rp.title}
                      fill
                      className="object-cover brightness-75 group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-black uppercase tracking-tighter text-white group-hover:text-neon transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {rp.readTime} мин
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
    </div>
  );
}
