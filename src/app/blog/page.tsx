"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Music,
  TrendingUp,
  Tag,
  ChevronRight,
  Bookmark,
  Share2,
  MessageCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sample blog posts data (will be replaced with real data later)
const blogPosts = [
  {
    id: 1,
    title: "Как легально использовать музыку в бизнесе: полное руководство 2026",
    excerpt:
      "Узнайте, как защитить свой бизнес от претензий РАО и ВОИС. Разбираем законодательство, лицензии и реальные кейсы.",
    content: "",
    author: {
      name: "Admin",
      avatar: "/images/author-1.png",
      role: "Команда БизнесМузыка",
    },
    publishedAt: "2026-03-15",
    readTime: 12,
    views: 2543,
    comments: 18,
    category: "Право",
    image: "/images/mood-1.png",
    featured: true,
  },
  {
    id: 2,
    title: "Влияние музыки на продажи: исследования и практика",
    excerpt:
      "Как правильно подобранная музыка увеличивает средний чек и время пребывания клиентов в магазине.",
    content: "",
    author: {
      name: "Анна Петрова",
      avatar: "/images/author-2.png",
      role: "Музыкальный куратор",
    },
    publishedAt: "2026-03-12",
    readTime: 8,
    views: 1876,
    comments: 12,
    category: "Исследования",
    image: "/images/mood-2.png",
    featured: true,
  },
  {
    id: 3,
    title: "Топ-10 жанров для кофеен и ресторанов",
    excerpt:
      "Подборка лучших музыкальных направлений для создания атмосферы в заведениях общественного питания.",
    content: "",
    author: {
      name: "Михаил Соловьёв",
      avatar: "/images/author-3.png",
      role: "DJ, продюсер",
    },
    publishedAt: "2026-03-10",
    readTime: 6,
    views: 3421,
    comments: 24,
    category: "Подборки",
    image: "/images/hero.png",
    featured: false,
  },
  {
    id: 4,
    title: "Что такое синхронизация музыки и когда она нужна",
    excerpt:
      "Разбираемся в терминологии: когда нужна синхронизация, а когда достаточно публичного исполнения.",
    content: "",
    author: {
      name: "Admin",
      avatar: "/images/author-1.png",
      role: "Команда БизнесМузыка",
    },
    publishedAt: "2026-03-08",
    readTime: 10,
    views: 1654,
    comments: 8,
    category: "Право",
    image: "/images/mood-1.png",
    featured: false,
  },
  {
    id: 5,
    title: "Как музыка влияет на продуктивность сотрудников",
    excerpt:
      "Научные исследования о влиянии фоновой музыки на концентрацию, настроение и эффективность работы.",
    content: "",
    author: {
      name: "Елена Козлова",
      avatar: "/images/author-2.png",
      role: "Психолог",
    },
    publishedAt: "2026-03-05",
    readTime: 7,
    views: 2187,
    comments: 15,
    category: "Исследования",
    image: "/images/mood-2.png",
    featured: false,
  },
  {
    id: 6,
    title: "Новые треки марта 2026: обзор обновлений",
    excerpt:
      "Свежие поступления в нашу библиотеку: джаз, лаунж, электроника и не только.",
    content: "",
    author: {
      name: "Михаил Соловьёв",
      avatar: "/images/author-3.png",
      role: "DJ, продюсер",
    },
    publishedAt: "2026-03-01",
    readTime: 5,
    views: 987,
    comments: 6,
    category: "Новости",
    image: "/images/hero.png",
    featured: false,
  },
];

const categories = [
  { name: "Все", count: 24 },
  { name: "Право", count: 8 },
  { name: "Исследования", count: 6 },
  { name: "Подборки", count: 5 },
  { name: "Новости", count: 3 },
  { name: "Кейсы", count: 2 },
];

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "Все" || post.category === selectedCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = filteredPosts.filter((post) => post.featured);
  const regularPosts = filteredPosts.filter((post) => !post.featured);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Header */}
      <section className="text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
          <Music className="w-4 h-4 text-neon" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">
            Блог и новости
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white">
          Блог <span className="text-neon">Бизнес</span> <br />
          <span className="outline-text">Музыка</span>
        </h1>

        <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
          Статьи о музыкальном лицензировании, исследования влияния музыки на
          бизнес и полезные советы для предпринимателей.
        </p>

        {/* Search */}
        <div className="max-w-xl mx-auto pt-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск статей..."
              className="pl-12 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6">
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={cn(
                "px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all border",
                selectedCategory === category.name
                  ? "bg-neon text-black border-neon shadow-[0_0_20px_rgba(92,243,135,0.3)]"
                  : "bg-white/[0.02] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
              )}
            >
              {category.name}
              <span className="ml-2 opacity-60">({category.count})</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="group relative rounded-[3rem] overflow-hidden border border-white/5 bg-white/[0.02] hover:border-neon/30 transition-all duration-500"
              >
                <div className="relative h-72 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover brightness-75 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  {/* Category Badge */}
                  <div className="absolute top-6 left-6">
                    <div className="px-4 py-2 rounded-full bg-neon text-black text-xs font-black uppercase tracking-widest">
                      {post.category}
                    </div>
                  </div>

                  {/* Bookmark */}
                  <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-neon hover:text-black transition-colors">
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-8 space-y-4">
                  <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white group-hover:text-neon transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-neutral-400 text-sm font-medium leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-bold">
                        {post.views.toLocaleString("ru-RU")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Regular Posts */}
      <section className="px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
              Все статьи
            </h2>
            <div className="flex items-center gap-2 text-neon">
              <span className="text-sm font-black uppercase tracking-widest">
                {filteredPosts.length} статей
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="group rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.02] hover:border-neon/30 transition-all duration-500"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover brightness-75 group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

                  {/* Category */}
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10">
                      <Tag className="w-3 h-3 text-neon" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">
                        {post.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white group-hover:text-neon transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-neutral-500 text-sm font-medium leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neon/20 border border-neon/20 overflow-hidden">
                        <Image
                          src={post.author.avatar}
                          alt={post.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-tight">
                          {post.author.name}
                        </p>
                        <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                          {post.readTime} мин
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-neon group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {regularPosts.length === 0 && (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-neutral-600" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">
                Ничего не найдено
              </h3>
              <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                Попробуйте изменить параметры поиска
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[3rem] p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-neon/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-32 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
              <MessageCircle className="w-4 h-4 text-neon" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">
                Рассылка
              </span>
            </div>

            <h2 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white">
              Подпишитесь на <span className="text-neon">новости</span>
            </h2>

            <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Получайте свежие статьи, новости музыки и советы для бизнеса
              прямо на почту. Никакого спама.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Ваш email"
                className="flex-1 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
              />
              <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-8 h-14 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)]">
                Подписаться
              </Button>
            </div>

            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
              Отписка в один клик
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
