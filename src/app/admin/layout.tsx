import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import Sidebar from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar user={user} />
      <main className="ml-64 min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
