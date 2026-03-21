export async function GET() {
  // This debug endpoint is only available in development
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: categories, error } = await supabase
      .from("blog_categories")
      .select("*")
      .limit(3);

    if (error) {
      return Response.json({ 
        success: false, 
        error: error.message,
      }, { status: 500 });
    }

    const { count } = await supabase
      .from("blog_posts")
      .select("*", { count: "exact", head: true })
      .eq("published", true);

    return Response.json({ 
      success: true, 
      categories: categories?.length || 0,
      publishedPosts: count || 0,
      message: "Connection successful!"
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ 
      success: false, 
      error: message,
    }, { status: 500 });
  }
}
