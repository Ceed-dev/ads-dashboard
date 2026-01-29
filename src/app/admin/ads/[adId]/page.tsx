"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Archive } from "lucide-react";
import type { AdDTO } from "@/types/ad";
import type { AdvertiserDTO } from "@/types/advertiser";

export default function AdDetailPage({
  params,
}: {
  params: Promise<{ adId: string }>;
}) {
  const { adId } = use(params);
  const router = useRouter();
  const [ad, setAd] = useState<AdDTO | null>(null);
  const [advertisers, setAdvertisers] = useState<AdvertiserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/ads/${adId}`).then((res) => res.json()),
      fetch("/api/admin/advertisers?status=active").then((res) => res.json()),
    ])
      .then(([adData, advData]) => {
        setAd(adData);
        setTags(adData.tags || []);
        setAdvertisers(advData.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [adId]);

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
    setSaving(true);
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
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update ad");
      }

      router.refresh();
      const updated = await res.json();
      setAd(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/admin/ads/${adId}/duplicate`, {
        method: "POST",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to duplicate ad");
      }

      const { id } = await res.json();
      router.push(`/admin/ads/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const handleArchive = async () => {
    if (!confirm("Are you sure you want to archive this ad?")) return;

    try {
      const res = await fetch(`/api/admin/ads/${adId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to archive ad");
      }

      router.push("/admin/ads");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (!ad) {
    return <div className="text-red-600">Ad not found</div>;
  }

  const isArchived = ad.status === "archived";

  return (
    <div>
      <Link href="/admin/ads" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />Back to Ads
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Ad</h1>
        <div className="flex gap-2">
          <button onClick={handleDuplicate} className="inline-flex items-center px-3 py-2 border rounded-md hover:bg-gray-50">
            <Copy className="w-4 h-4 mr-2" />Duplicate
          </button>
          {!isArchived && (
            <button onClick={handleArchive} className="inline-flex items-center px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50">
              <Archive className="w-4 h-4 mr-2" />Archive
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-500">
        ID: {ad.id}
      </div>

      {isArchived && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-800 rounded-md">
          This ad is archived and cannot be edited.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">{error}</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Advertiser *</label>
          <select name="advertiserId" required disabled={isArchived} defaultValue={ad.advertiserId} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100">
            <option value="">Select...</option>
            {advertisers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (EN) *</label>
            <input name="titleEng" required disabled={isArchived} defaultValue={ad.title.eng} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (JP)</label>
            <input name="titleJpn" disabled={isArchived} defaultValue={ad.title.jpn || ""} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (EN) *</label>
            <textarea name="descEng" required disabled={isArchived} rows={3} defaultValue={ad.description.eng} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (JP)</label>
            <textarea name="descJpn" disabled={isArchived} rows={3} defaultValue={ad.description.jpn || ""} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text (EN) *</label>
            <input name="ctaEng" required disabled={isArchived} defaultValue={ad.ctaText.eng} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text (JP)</label>
            <input name="ctaJpn" disabled={isArchived} defaultValue={ad.ctaText.jpn || ""} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">CTA URL *</label>
          <input name="ctaUrl" type="url" required disabled={isArchived} defaultValue={ad.ctaUrl} placeholder="https://..." className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags *</label>
          {!isArchived && (
            <div className="flex gap-2 mb-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag..." className="flex-1 px-3 py-2 border rounded-md" />
              <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-200 rounded-md">Add</button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded-full text-sm">
                {tag}
                {!isArchived && (
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-500 hover:text-gray-700">×</button>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" disabled={isArchived} defaultValue={ad.status} className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100">
            <option value="paused">Paused</option>
            <option value="active">Active</option>
            {isArchived && <option value="archived">Archived</option>}
          </select>
        </div>

        {!isArchived && (
          <button type="submit" disabled={saving} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}

        <div className="mt-6 pt-6 border-t text-sm text-gray-500">
          <p>Created: {new Date(ad.meta.createdAt).toLocaleString()} by {ad.meta.createdBy}</p>
          <p>Updated: {new Date(ad.meta.updatedAt).toLocaleString()} by {ad.meta.updatedBy}</p>
        </div>
      </form>
    </div>
  );
}
