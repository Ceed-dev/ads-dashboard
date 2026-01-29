"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import type { AdvertiserDTO } from "@/types/advertiser";

export default function AdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<AdvertiserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchAdvertisers();
  }, [search, statusFilter]);

  const fetchAdvertisers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/advertisers?${params}`);
      const data = await res.json();
      setAdvertisers(data.items || []);
    } catch (error) {
      console.error("Failed to fetch advertisers:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Advertisers</h1>
        <Link
          href="/admin/advertisers/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Advertiser
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search advertisers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : advertisers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No advertisers found
          </div>
        ) : (
          <ul className="divide-y">
            {advertisers.map((advertiser) => (
              <li key={advertiser.id}>
                <Link
                  href={`/admin/advertisers/${advertiser.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {advertiser.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {advertiser.websiteUrl || "No website"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        advertiser.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {advertiser.status}
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
