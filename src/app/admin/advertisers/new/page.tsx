"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewAdvertiserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      websiteUrl: formData.get("websiteUrl") as string || undefined,
      status: formData.get("status") as string,
    };

    try {
      const res = await fetch("/api/admin/advertisers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create advertiser");
      }

      const { id } = await res.json();
      router.push(`/admin/advertisers/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/admin/advertisers" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Advertisers
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Advertiser</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-lg">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input name="name" required className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input name="websiteUrl" type="url" placeholder="https://..." className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" defaultValue="active" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Creating..." : "Create Advertiser"}
        </button>
      </form>
    </div>
  );
}
