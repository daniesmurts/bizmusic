import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Double check role in layout as well
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-black text-white selection:bg-neon selection:text-black">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 bg-neon/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 p-32 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none" />

        <AdminProviders>
          <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
            {children}
          </div>
        </AdminProviders>
      </main>
      <Toaster position="top-right" theme="dark" closeButton />
    </div>
  );
}
