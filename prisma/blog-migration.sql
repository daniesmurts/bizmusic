-- Blog Tables Migration Script for Supabase
-- Run this directly in Supabase SQL Editor

-- Create blog categories table
CREATE TABLE IF NOT EXISTS "blog_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_categories_name_key" ON "blog_categories"("name");

-- Create blog posts table
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "categoryId" UUID NOT NULL,
    "authorId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_key" ON "blog_posts"("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_categoryId_idx" ON "blog_posts"("categoryId");
CREATE INDEX IF NOT EXISTS "blog_posts_published_idx" ON "blog_posts"("published");

-- Create blog post tags table
CREATE TABLE IF NOT EXISTS "blog_post_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "postId" UUID NOT NULL,
    "tagName" TEXT NOT NULL,
    CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "blog_post_tags_postId_idx" ON "blog_post_tags"("postId");
CREATE INDEX IF NOT EXISTS "blog_post_tags_tagName_idx" ON "blog_post_tags"("tagName");

-- Add foreign key constraints
DO $$ BEGIN
    ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_fkey" 
    FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" 
    FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_postId_fkey" 
    FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert default categories
INSERT INTO "blog_categories" ("id", "name") VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Право'),
    ('a2b3c4d5-e6f7-8901-bcde-f12345678901', 'Исследования'),
    ('a3b4c5d6-e7f8-9012-cdef-123456789012', 'Подборки'),
    ('a4b5c6d7-e8f9-0123-def0-234567890123', 'Новости'),
    ('a5b6c7d8-e9f0-1234-ef01-345678901234', 'Кейсы')
ON CONFLICT (name) DO NOTHING;

-- Get admin user ID (adjust email if needed)
DO $$
DECLARE
    admin_user_id TEXT;
    category_pravo UUID;
    category_issledovaniya UUID;
    category_podborki UUID;
    category_novosti UUID;
BEGIN
    -- Get the first admin user
    SELECT id INTO admin_user_id FROM "users" WHERE "role" = 'ADMIN' LIMIT 1;

    -- If no admin exists, create one
    IF admin_user_id IS NULL THEN
        INSERT INTO "users" ("email", "passwordHash", "role")
        VALUES ('admin@bizmuzik.ru', '$2a$10$demo', 'ADMIN')
        RETURNING id INTO admin_user_id;
    END IF;

    -- Get category IDs
    SELECT id INTO category_pravo FROM "blog_categories" WHERE name = 'Право' LIMIT 1;
    SELECT id INTO category_issledovaniya FROM "blog_categories" WHERE name = 'Исследования' LIMIT 1;
    SELECT id INTO category_podborki FROM "blog_categories" WHERE name = 'Подборки' LIMIT 1;
    SELECT id INTO category_novosti FROM "blog_categories" WHERE name = 'Новости' LIMIT 1;

    -- Insert demo blog posts
    INSERT INTO "blog_posts" ("title", "slug", "excerpt", "content", "categoryId", "authorId", "imageUrl", "published", "featured", "views", "publishedAt") VALUES
    (
        'Как легально использовать музыку в бизнесе: полное руководство 2026',
        'kak-legalno-ispolzovat-muzyku-v-biznese-polnoe-rukovodstvo-2026',
        'Узнайте, как защитить свой бизнес от претензий РАО и ВОИС. Разбираем законодательство, лицензии и реальные кейсы.',
        '## Введение

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

**Нужна помощь с выбором тарифа?** [Свяжитесь с нами](/contact) для бесплатной консультации.',
        category_pravo,
        admin_user_id,
        '/images/mood-1.png',
        true,
        true,
        2543,
        CURRENT_TIMESTAMP
    ),
    (
        'Влияние музыки на продажи: исследования и практика',
        'vliyanie-muzyki-na-prodazhi-issledovaniya-i-praktika',
        'Как правильно подобранная музыка увеличивает средний чек и время пребывания клиентов в магазине.',
        '## Введение

Музыка — это мощный инструмент влияния на поведение покупателей. В этой статье мы рассмотрим научные исследования и практические кейсы использования музыки в ритейле.

## Основные исследования

### Темп музыки и скорость покупок

Исследования показывают, что:
- **Медленная музыка** (60-80 BPM) увеличивает время пребывания в магазине на 18%
- **Быстрая музыка** (100+ BPM) ускоряет поток покупателей, но снижает средний чек

### Жанр и восприятие бренда

Правильно подобранный жанр музыки:
- Увеличивает лояльность к бренду на 24%
- Улучшает восприятие качества товаров
- Создаёт эмоциональную связь с магазином

## Практические рекомендации

### Для кофеен:

- Утром: бодрая акустическая музыка (80-100 BPM)
- Днём: лаунж и лёгкий джаз (70-90 BPM)
- Вечером: атмосферная электроника (90-110 BPM)

### Для бутиков:

- Премиум сегмент: классическая музыка, джаз
- Масс-маркет: популярные хиты, танцевальная музыка

### Для супермаркетов:

- Фоновая музыка средней громкости
- Знакомые мелодии для создания комфорта
- Исключение резких переходов между треками

## Кейс: Сеть кофеен

**Задача:** Увеличить средний чек и время пребывания

**Решение:**
- Внедрили тематические плейлисты для разных времён суток
- Настроили громкость на уровне 65-70 дБ

**Результат:**
- Средний чек вырос на 12%
- Время пребывания увеличилось на 15 минут
- Возвращаемость клиентов выросла на 18%

## Заключение

Правильно подобранная музыка — это инвестиция в клиентский опыт, которая окупается ростом продаж и лояльности.',
        category_issledovaniya,
        admin_user_id,
        '/images/mood-2.png',
        true,
        true,
        1876,
        CURRENT_TIMESTAMP
    ),
    (
        'Топ-10 жанров для кофеен и ресторанов',
        'top-10-zhanrov-dlya-kofeen-i-restoranov',
        'Подборка лучших музыкальных направлений для создания атмосферы в заведениях общественного питания.',
        '## Введение

Правильный музыкальный фон способен превратить обычное заведение в место, куда хочется возвращаться. Мы составили топ-10 жанров для различных форматов заведений.

## Топ жанров

### 1. Лаунж (Lounge)

**Идеально для:** Кофеен, лаунж-зон, спа

**Характеристики:**
- Темп: 70-90 BPM
- Атмосфера: расслабляющая, ненавязчивая
- Инструменты: электронные, акустические

### 2. Джаз (Jazz)

**Идеально для:** Ресторанов, винных баров, вечерних заведений

**Поджанры:**
- Smooth Jazz
- Bebop
- Cool Jazz

### 3. Чилаут (Chillout)

**Идеально для:** Кафе, коворкингов, дневных заведений

**Особенности:**
- Минимальное вокальное сопровождение
- Плавные переходы между треками

### 4. Босса-нова (Bossa Nova)

**Идеально для:** Бранчей, летних веранд, кофеен

**Атмосфера:**
- Лёгкость и непринуждённость
- Ассоциация с отдыхом и отпуском

### 5. Эмбиент (Ambient)

**Идеально для:** Спа, йога-студий, медитативных пространств

**Характеристики:**
- Отсутствие выраженного ритма
- Атмосферные звуковые ландшафты

## Рекомендации по времени суток

| Время | Жанр | Темп |
|-------|------|------|
| Утро (7-11) | Акустика, фолк | 80-100 BPM |
| День (11-17) | Лаунж, чилаут | 70-90 BPM |
| Вечер (17-23) | Джаз, дип-хаус | 90-120 BPM |

## Заключение

Экспериментируйте с жанрами, отслеживайте реакцию гостей и находите идеальное звучание для вашего заведения.',
        category_podborki,
        admin_user_id,
        '/images/hero.png',
        true,
        false,
        3421,
        CURRENT_TIMESTAMP
    ),
    (
        'Что такое синхронизация музыки и когда она нужна',
        'chto-takoe-sinhronizatsiya-muzyki-i-kogda-ona-nuzhna',
        'Разбираемся в терминологии: когда нужна синхронизация, а когда достаточно публичного исполнения.',
        '## Введение

Синхронизация — это один из самых сложных аспектов музыкального лицензирования. Разберёмся, что это такое и когда требуется.

## Что такое синхронизация?

**Синхронизация** — это право на использование музыкального произведения в синхронизации с визуальным рядом.

### Когда требуется:

- Реклама на ТВ и в интернете
- YouTube-ролики
- Подкасты с музыкальным оформлением
- Презентации и корпоративные видео
- Социальные сети бизнеса

## Отличия от публичного исполнения

| Публичное исполнение | Синхронизация |
|---------------------|---------------|
| Фоновая музыка в помещении | Музыка в видео |
| Не требует привязки к визуалу | Требует синхронизации |
| Лицензируется по помещению | Лицензируется по проекту |

## Типы синхронизации

### 1. Мастер-лицензия

Использование конкретной записи:
- Оригинальное исполнение
- Конкретный артист

### 2. Композиционная лицензия

Использование самой композиции:
- Возможность кавер-версии
- Переработка аранжировки

## Как получить лицензию на синхронизацию

### Шаг 1: Определите права

- Кто владеет правами на композицию
- Кто владеет правами на запись

### Шаг 2: Запросите лицензию

- Опишите проект
- Укажите сроки и территорию
- Согласуйте стоимость

### Шаг 3: Получите договор

- Лицензионный договор
- Акт синхронизации

## Стоимость синхронизации

Факторы, влияющие на цену:
- Известность трека
- Территория использования
- Срок использования
- Тип проекта (коммерческий/некоммерческий)

## Заключение

Синхронизация — это отдельный вид лицензирования, который требует индивидуального подхода. Всегда уточняйте права перед использованием музыки в видео.',
        category_pravo,
        admin_user_id,
        '/images/mood-1.png',
        true,
        false,
        1654,
        CURRENT_TIMESTAMP
    ),
    (
        'Как музыка влияет на продуктивность сотрудников',
        'kak-muzyka-vliyaet-na-produktivnost-sotrudnikov',
        'Научные исследования о влиянии фоновой музыки на концентрацию, настроение и эффективность работы.',
        '## Введение

Музыка на рабочем месте — это не просто фон, а инструмент повышения продуктивности. Рассмотрим научные данные и практические рекомендации.

## Научные исследования

### Влияние на концентрацию

Исследования показывают:
- **Инструментальная музыка** улучшает концентрацию на 15%
- **Знакомая музыка** снижает отвлекаемость
- **Громкость 50-60 дБ** оптимальна для офисной работы

### Влияние на настроение

Правильно подобранная музыка:
- Снижает уровень стресса на 23%
- Повышает удовлетворённость работой
- Улучшает командную динамику

## Рекомендации по жанрам

### Для офисной работы:

- Классическая музыка (Моцарт, Бах)
- Лаунж и чилаут
- Эмбиент

### Для творческих задач:

- Джаз
- Электронная музыка
- Саундтреки

### Для физических задач:

- Ритмичная музыка (100-120 BPM)
- Поп-хиты
- Танцевальная музыка

## Практика внедрения

### 1. Зонирование

- Тихие зоны без музыки
- Зоны с фоновой музыкой
- Зоны с активным звучанием

### 2. Время суток

- Утро: бодрая музыка для «разгона»
- День: нейтральный фон
- Вечер: расслабляющие композиции

### 3. Обратная связь

- Опросы сотрудников
- A/B тестирование плейлистов
- Мониторинг продуктивности

## Кейс: Офис IT-компании

**Задача:** Повысить продуктивность разработчиков

**Решение:**
- Внедрили адаптивные плейлисты
- Настроили зонирование по громкости

**Результат:**
- Продуктивность выросла на 12%
- Удовлетворённость работой +18%
- Снижение текучести кадров

## Заключение

Музыка — это доступный инструмент повышения продуктивности. Главное — найти баланс между предпочтениями сотрудников и задачами бизнеса.',
        category_issledovaniya,
        admin_user_id,
        '/images/mood-2.png',
        true,
        false,
        2187,
        CURRENT_TIMESTAMP
    ),
    (
        'Новые треки марта 2026: обзор обновлений',
        'novye-treki-marta-2026-obzor-obnovleniy',
        'Свежие поступления в нашу библиотеку: джаз, лаунж, электроника и не только.',
        '## Введение

В марте 2026 года мы обновили нашу библиотеку более чем 150 новыми треками. В этом обзоре — главные новинки месяца.

## Новые альбомы

### «Morning Jazz Sessions»

**Жанр:** Джаз  
**Треков:** 24  
**Атмосфера:** Утренняя, лёгкая, акустическая

**Лучшие треки:**
- «Coffee & Saxophone»
- «Sunday Brunch»
- «Urban Morning»

### «Electronic Lounge Vol. 3»

**Жанр:** Электроника, лаунж  
**Треков:** 18  
**Атмосфера:** Современная, атмосферная, ненавязчивая

**Лучшие треки:**
- «Neon Dreams»
- «Digital Sunset»
- «Midnight City Lounge»

### «Acoustic Cafe»

**Жанр:** Акустика, фолк  
**Треков:** 20  
**Атмосфера:** Тёплая, уютная, домашняя

**Лучшие треки:**
- «Guitar & Rain»
- «Old Vinyl»
- «Cafe Stories»

## Жанровые обновления

### Джаз

Добавлено 45 новых треков:
- Smooth Jazz
- Bebop
- Fusion

### Электроника

Добавлено 60 новых треков:
- Deep House
- Chillout
- Downtempo

### Акустика

Добавлено 45 новых треков:
- Guitar
- Piano
- Strings

## Рекомендации по использованию

### Для кофеен:

«Morning Jazz Sessions» + «Acoustic Cafe»

### Для офисов:

«Electronic Lounge Vol. 3» + джазовые подборки

### Для ритейла:

Комбинация всех трёх альбомов в зависимости от времени суток

## Планы на апрель

В следующем месяце ожидайте:
- Альбом «Summer Vibes 2026»
- Коллекцию «World Music»
- Специальную подборку для фитнес-центров

## Заключение

Наши библиотеки постоянно обновляются. Следите за новинками и создавайте идеальные плейлисты для вашего бизнеса.',
        category_novosti,
        admin_user_id,
        '/images/hero.png',
        true,
        false,
        987,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- Add tags to posts (separate block to avoid nesting issues)
DO $$
DECLARE
    post_id UUID;
BEGIN
    -- Tags for first post
    SELECT id INTO post_id FROM "blog_posts" WHERE slug = 'kak-legalno-ispolzovat-muzyku-v-biznese-polnoe-rukovodstvo-2026' LIMIT 1;
    INSERT INTO "blog_post_tags" ("postId", "tagName") VALUES
        (post_id, 'Лицензирование'), (post_id, 'РАО'), (post_id, 'ВОИС'), (post_id, '152-ФЗ'), (post_id, 'Бизнес');

    -- Tags for second post
    SELECT id INTO post_id FROM "blog_posts" WHERE slug = 'vliyanie-muzyki-na-prodazhi-issledovaniya-i-praktika' LIMIT 1;
    INSERT INTO "blog_post_tags" ("postId", "tagName") VALUES
        (post_id, 'Продажи'), (post_id, 'Исследования'), (post_id, 'Ритейл'), (post_id, 'Психология');

    -- Tags for third post
    SELECT id INTO post_id FROM "blog_posts" WHERE slug = 'top-10-zhanrov-dlya-kofeen-i-restoranov' LIMIT 1;
    INSERT INTO "blog_post_tags" ("postId", "tagName") VALUES
        (post_id, 'Жанры'), (post_id, 'Подборки'), (post_id, 'HoReCa'), (post_id, 'Рестораны');

    -- Tags for fourth post
    SELECT id INTO post_id FROM "blog_posts" WHERE slug = 'chto-takoe-sinhronizatsiya-muzyki-i-kogda-ona-nuzhna' LIMIT 1;
    INSERT INTO "blog_post_tags" ("postId", "tagName") VALUES
        (post_id, 'Синхронизация'), (post_id, 'Лицензирование'), (post_id, 'Видео'), (post_id, 'Право');

    -- Tags for fifth post
    SELECT id INTO post_id FROM "blog_posts" WHERE slug = 'kak-muzyka-vliyaet-na-produktivnost-sotrudnikov' LIMIT 1;
    INSERT INTO "blog_post_tags" ("postId", "tagName") VALUES
        (post_id, 'Продуктивность'), (post_id, 'Исследования'), (post_id, 'Офис'), (post_id, 'Психология');

    -- Tags for sixth post
    SELECT id INTO post_id FROM "blog_posts" WHERE slug = 'novye-treki-marta-2026-obzor-obnovleniy' LIMIT 1;
    INSERT INTO "blog_post_tags" ("postId", "tagName") VALUES
        (post_id, 'Новости'), (post_id, 'Обновления'), (post_id, 'Музыка'), (post_id, 'Библиотека');
END $$;
