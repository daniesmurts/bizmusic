# Blog Setup Instructions

## Setting up the blog for editing

The blog articles are now stored in the database and can be edited via the admin panel.

### Step 1: Run the migration

First, push the blog schema to your database:

```bash
npx drizzle-kit push
```

Or run a named migration:

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

### Step 2: Seed demo articles

After the tables are created, seed the demo articles:

```bash
npm run db:seed:blog
```

This will create 6 demo articles:
1. "Как легально использовать музыку в бизнесе" (Право)
2. "Влияние музыки на продажи" (Исследования)
3. "Топ-10 жанров для кофеен и ресторанов" (Подборки)
4. "Что такое синхронизация музыки" (Право)
5. "Как музыка влияет на продуктивность сотрудников" (Исследования)
6. "Новые треки марта 2026" (Новости)

### Step 3: Edit articles in admin panel

1. Go to `/admin/blog` in your browser
2. Click the edit button (pencil icon) on any article
3. Make your changes
4. Click "Сохранить" to save

### Creating new articles

1. Go to `/admin/blog`
2. Click "Добавить" button
3. Fill in the form:
   - Название статьи (title)
   - URL статьи (slug) - auto-generated from title
   - Краткое описание (excerpt)
   - Содержание (content) - supports Markdown
   - Категория (category)
   - Обложка (image URL)
   - Теги (tags)
4. Toggle "Опубликовано" to publish immediately
5. Toggle "Избранное" to feature on the blog homepage
6. Click "Сохранить"

### Markdown Support

In the content field, you can use:

- `## Heading` for H2 headings
- `### Subheading` for H3 headings
- `**bold text**` for bold
- `*italic*` for italic
- `- list item` for unordered lists
- `1. list item` for ordered lists
- `✅ checkmark` for special checkmark boxes
- `> quote` for blockquotes
- `[link text](url)` for links
- `` `code` `` for inline code

### Database Tables

The blog uses these tables:
- `blog_posts` - Main articles
- `blog_categories` - Categories (Право, Исследования, etc.)
- `blog_post_tags` - Tags for each post
