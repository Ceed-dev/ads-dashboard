"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { AdvertiserDTO } from "@/types/advertiser";

export default function NewAdPage() {
  const router = useRouter();
  const [advertisers, setAdvertisers] = useState<AdvertiserDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetch("/api/admin/advertisers?status=active")
      .then((res) => res.json())
      .then((data) => setAdvertisers(data.items || []));
  }, []);

  const addTag = () => {
    const tag = tagInput.toLowerCase().trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      advertiserId: formData.get("advertiserId") as string,
      title: { eng: formData.get("titleEng") as string, jpn: formData.get("titleJpn") as string || undefined },
      description: { eng: formData.get("descEng") as string, jpn: formData.get("descJpn") as string || undefined },
      ctaText: { eng: formData.get("ctaEng") as string, jpn: formData.get("ctaJpn") as string || undefined },
      ctaUrl: formData.get("ctaUrl") as string,
      tags,
      status: formData.get("status") as string,
    };

    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create ad");
      }

      const { id } = await res.json();
      router.push(`/admin/ads/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/admin/ads" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />Back to Ads
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Ad</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser *</label>
          <select name="advertiserId" required className="w-full px-3 py-2 border rounded-md">
            <option value="">Select...</option>
            {advertisers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN) *</label>
            <input name="titleEng" required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (JP)</label>
            <input name="titleJpn" className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN) *</label>
            <textarea name="descEng" required rows={3} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (JP)</label>
            <textarea name="descJpn" rows={3} className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text (EN) *</label>
            <input name="ctaEng" required className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text (JP)</label>
            <input name="ctaJpn" className="w-full px-3 py-2 border rounded-md" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">CTA URL *</label>
          <input name="ctaUrl" type="url" required placeholder="https://..." className="w-full px-3 py-2 border rounded-md" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags *</label>
          <div className="flex gap-2 mb-2">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag..." className="flex-1 px-3 py-2 border rounded-md" />
            <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-200 rounded-md">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-sm">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" defaultValue="paused" className="w-full px-3 py-2 border rounded-md">
            <option value="paused">Paused</option>
            <option value="active">Active</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
          {loading ? "Creating..." : "Create Ad"}
        </button>
      </form>
    </div>
  );
}
