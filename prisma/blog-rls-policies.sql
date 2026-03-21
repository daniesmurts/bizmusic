-- Enable RLS on blog tables
ALTER TABLE "blog_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "blog_post_tags" ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published blog posts
CREATE POLICY "Allow public read access to published posts"
ON "blog_posts"
FOR SELECT
USING (published = true);

-- Allow admin full access to blog posts (role check)
CREATE POLICY "Allow admin full access to blog posts"
ON "blog_posts"
FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- Allow public read access to categories
CREATE POLICY "Allow public read access to categories"
ON "blog_categories"
FOR SELECT
USING (true);

-- Allow admin full access to categories
CREATE POLICY "Allow admin full access to categories"
ON "blog_categories"
FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- Allow public read access to tags
CREATE POLICY "Allow public read access to tags"
ON "blog_post_tags"
FOR SELECT
USING (true);

-- Allow admin full access to tags
CREATE POLICY "Allow admin full access to tags"
ON "blog_post_tags"
FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));
