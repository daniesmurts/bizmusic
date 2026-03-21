import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log("Testing Supabase connection...");
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: categories, error } = await supabase
      .from("blog_categories")
      .select("*")
      .limit(3);

    if (error) {
      return Response.json({ 
        success: false, 
        error: error.message,
        details: error 
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

  } catch (error: any) {
    return Response.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
