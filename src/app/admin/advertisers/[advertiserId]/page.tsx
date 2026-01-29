"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import type { AdvertiserDTO } from "@/types/advertiser";

export default function AdvertiserDetailPage({ params }: { params: Promise<{ advertiserId: string }> }) {
  const { advertiserId } = use(params);
  const router = useRouter();
  const [advertiser, setAdvertiser] = useState<AdvertiserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/advertisers/${advertiserId}`)
      .then((res) => res.json())
      .then(setAdvertiser)
      .catch(() => setError("Failed to load advertiser"))
      .finally(() => setLoading(false));
  }, [advertiserId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      websiteUrl: formData.get("websiteUrl") as string || undefined,
      status: formData.get("status") as string,
    };

    try {
      const res = await fetch(`/api/admin/advertisers/${advertiserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!advertiser) return <div className="text-center py-8 text-red-600">Advertiser not found</div>;

  return (
    <div>
      <Link href="/admin/advertisers" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Advertisers
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Advertiser</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-lg">
        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input name="name" required defaultValue={advertiser.name} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
          <input name="websiteUrl" type="url" defaultValue={advertiser.websiteUrl || ""} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" defaultValue={advertiser.status} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <button type="submit" disabled={saving} className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
