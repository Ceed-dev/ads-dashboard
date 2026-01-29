import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import Header from "@/components/admin/Header";

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
    <div className="min-h-screen bg-gray-100">
      <Header user={user} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
