-- Enable RLS on blog tables
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_post_tags" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published blog posts
CREATE POLICY "Allow public read access to published posts"
ON "blog_posts"
FOR SELECT
USING (published = true);

-- Allow authenticated users (admin) full access to blog posts
CREATE POLICY "Allow admin full access to blog posts"
ON "blog_posts"
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access to categories
CREATE POLICY "Allow public read access to categories"
ON "blog_categories"
FOR SELECT
USING (true);

-- Allow authenticated users full access to categories
CREATE POLICY "Allow admin full access to categories"
ON "blog_categories"
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access to tags
CREATE POLICY "Allow public read access to tags"
ON "blog_post_tags"
FOR SELECT
USING (true);

-- Allow authenticated users full access to tags
CREATE POLICY "Allow admin full access to tags"
ON "blog_post_tags"
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
