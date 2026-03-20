"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { toast } from "sonner";

// Sample post data (will be replaced with real data later)
const samplePost = {
  id: 1,
  title: "Как легально использовать музыку в бизнесе: полное руководство 2026",
  excerpt:
    "Узнайте, как защитить свой бизнес от претензий РАО и ВОИС. Разбираем законодательство, лицензии и реальные кейсы.",
  content: `
## Введение

Музыкальное оформление бизнеса — это не просто вопрос атмосферы, но и юридической ответственности. В этой статье мы разберём все аспекты легального использования музыки в коммерческих целях.

## Что такое публичное исполнение?

Согласно статье 1243 Гражданского кодекса РФ, **публичное исполнение** — это представление произведения непосредственно или с помощью технических средств в месте, открытом для свободного посещения, или в месте, где присутствует значительное число лиц, не принадлежащих к обычному кругу семьи.

### Где требуется лицензия:

- Кафе и рестораны
- Магазины и торговые центры
- Офисные помещения
- Салоны красоты и спа
- Фитнес-центры
- Отели и хостелы
- Транспортные средства (такси, автобусы)

## РАО и ВОИС: кто они и зачем платить?

**РАО** (Российское авторское общество) и **ВОИС** (Всероссийская организация интеллектуальной собственности) — это организации по коллективному управлению правами.

### Проблемы с РАО/ВОИС:

1. **Высокие тарифы** — выплаты могут достигать десятков тысяч рублей в месяц
2. **Сложность отчётности** — необходимо предоставлять подробные отчёты об использовании
3. **Штрафы** — за нарушение авторских прав предусмотрены штрафы до 5 млн рублей

## Альтернатива: прямая лицензия

Прямая лицензия от правообладателя позволяет:

✅ **Легально использовать музыку** без выплат в РАО/ВОИС
✅ **Фиксированная стоимость** — никаких неожиданных платежей
✅ **Простая отчётность** — минимальные требования к документации
✅ **Защита от претензий** — вы получаете все необходимые документы

## Как получить лицензию?

### Шаг 1: Выберите тариф

Определитесь с форматом использования музыки:
- Только стриминг в помещении
- Скачивание треков
- Использование в видео и соцсетях

### Шаг 2: Зарегистрируйтесь

Создайте аккаунт в сервисе «БизнесМузыка» и укажите реквизиты вашего бизнеса.

### Шаг 3: Оплатите подписку

Выберите удобный способ оплаты: банковская карта, СБП или безнал для юрлиц.

### Шаг 4: Получите документы

После оплаты вы получите:
- Лицензионный сертификат
- Акт выполненных работ (УПД)
- Доступ к музыкальной библиотеке

## Что будет при проверке?

При проверке контролирующие органы могут запросить:

1. **Лицензионный договор** — подтверждение права на использование музыки
2. **Документы об оплате** — чеки, акты, платёжные поручения
3. **Плей-листы** — список воспроизводимых произведений

### Штрафы за нарушение:

- Граждане: 1 500 — 2 000 ₽
- Должностные лица: 10 000 — 20 000 ₽
- Юридические лица: 30 000 — 40 000 ₽

## Кейсы из практики

### Кейс 1: Кофейня в Москве

**Проблема:** Получили претензию от РАО на сумму 150 000 ₽

**Решение:** Перешли на прямую лицензию «БизнесМузыка»

**Результат:** 
- Претензия урегулирована
- Ежемесячные выплаты снизились с 15 000 ₽ до 1 490 ₽
- Полная юридическая защита

### Кейс 2: Сеть фитнес-клубов

**Проблема:** Ежегодные выплаты ВОИС составляли 500 000 ₽

**Решение:** Лицензировали всю сеть через «БизнесМузыка»

**Результат:**
- Экономия 380 000 ₽ в год
- Унифицированная музыкальная политика
- Централизованное управление

## Заключение

Легальное использование музыки — это не только требование закона, но и инвестиция в репутацию вашего бизнеса. Прямая лицензия от правообладателя позволяет сэкономить значительные средства и избежать юридических рисков.

---

**Нужна помощь с выбором тарифа?** [Свяжитесь с нами](/contact) для бесплатной консультации.
`,
  author: {
    name: "Admin",
    avatar: "/images/author-1.png",
    role: "Команда БизнесМузыка",
    bio: "Официальный аккаунт команды БизнесМузыка. Мы делимся новостями, обновлениями и важной информацией о музыкальном лицензировании.",
  },
  publishedAt: "2026-03-15",
  updatedAt: "2026-03-16",
  readTime: 12,
  views: 2543,
  comments: 18,
  category: "Право",
  tags: ["Лицензирование", "РАО", "ВОИС", "152-ФЗ", "Бизнес"],
  image: "/images/mood-1.png",
};

const relatedPosts = [
  {
    id: 2,
    title: "Влияние музыки на продажи: исследования и практика",
    excerpt: "Как правильно подобранная музыка увеличивает средний чек...",
    image: "/images/mood-2.png",
    readTime: 8,
  },
  {
    id: 3,
    title: "Топ-10 жанров для кофеен и ресторанов",
    excerpt: "Подборка лучших музыкальных направлений...",
    image: "/images/hero.png",
    readTime: 6,
  },
  {
    id: 4,
    title: "Что такое синхронизация музыки",
    excerpt: "Разбираемся в терминологии...",
    image: "/images/mood-1.png",
    readTime: 10,
  },
];

export default function BlogPostPage() {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleShare = (platform: string) => {
    toast.info(`Поделиться в ${platform}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Ссылка скопирована");
  };

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
              {samplePost.category}
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {new Date(samplePost.publishedAt).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">
                {samplePost.readTime} мин
              </span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-[0.9] text-white">
            {samplePost.title}
          </h1>

          {/* Excerpt */}
          <p className="text-xl text-neutral-400 font-medium leading-relaxed">
            {samplePost.excerpt}
          </p>

          {/* Author & Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-neon/20 border border-neon/20 overflow-hidden">
                <Image
                  src={samplePost.author.avatar}
                  alt={samplePost.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-white font-black uppercase tracking-tight">
                  {samplePost.author.name}
                </p>
                <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">
                  {samplePost.author.role}
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
              src={samplePost.image}
              alt={samplePost.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Article Content */}
      <article className="px-6">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-invert prose-lg max-w-none">
            <div
              className="text-neutral-300 text-lg font-medium leading-relaxed space-y-8"
              dangerouslySetInnerHTML={{
                __html: samplePost.content
                  .replace(/## /g, '<h2 class="text-3xl font-black uppercase tracking-tighter text-white mt-12 mb-6">')
                  .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-black">$1</strong>')
                  .replace(/\n\n/g, '</p><p class="mt-4">')
                  .replace(/### /g, '<h3 class="text-xl font-black uppercase tracking-tight text-white mt-8 mb-4">')
                  .replace(/✅ /g, '<span class="text-neon">✓</span> ')
                  .replace(/^- /gm, '<li class="ml-4">')
                  .replace(/\n/g, ''),
              }}
            />
          </div>

          {/* Tags */}
          <div className="pt-12 mt-12 border-t border-white/5">
            <div className="flex items-center gap-3 flex-wrap">
              <Tag className="w-5 h-5 text-neutral-500" />
              {samplePost.tags.map((tag) => (
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
                src={samplePost.author.avatar}
                alt={samplePost.author.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
                  {samplePost.author.name}
                </h3>
                <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                  {samplePost.author.role}
                </p>
              </div>
              <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                {samplePost.author.bio}
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
            {relatedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
