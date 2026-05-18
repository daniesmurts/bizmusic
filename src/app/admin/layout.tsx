import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-user";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { Footer } from "@/components/Footer";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  // Double check role in layout as well
  const userData = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });

  if (userData?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-neon selection:text-black">
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-32 bg-neon/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-32 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none" />

          <AdminProviders>
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
              {children}
            </div>
            <Footer variant="admin" />
          </AdminProviders>
        </main>
      </div>
    </div>
  );
}
