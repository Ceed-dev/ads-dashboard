"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import type { AdDTO } from "@/types/ad";

export default function AdsPage() {
  const [ads, setAds] = useState<AdDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchAds();
  }, [search, statusFilter]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/ads?${params}`);
      const data = await res.json();
      setAds(data.items || []);
    } catch (error) {
      console.error("Failed to fetch ads:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "paused": return "bg-yellow-100 text-yellow-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
        <Link
          href="/admin/ads/new"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Ad
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : ads.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No ads found</div>
        ) : (
          <ul className="divide-y">
            {ads.map((ad) => (
              <li key={ad.id}>
                <Link
                  href={`/admin/ads/${ad.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {ad.title.eng || ad.title.jpn || "Untitled"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {ad.advertiserName} • {ad.tags.slice(0, 3).join(", ")}
                      {ad.tags.length > 3 && ` +${ad.tags.length - 3}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ad.status)}`}>
                      {ad.status}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
