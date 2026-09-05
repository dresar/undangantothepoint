"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FileText, Settings, Home } from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/invitations/stats");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">Kelola undangan digital Anda</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Total Undangan
                </p>
                <p className="text-4xl font-bold text-gray-900 mt-2">
                  {stats.total}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Aktif
                </p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {stats.active}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <Home className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Draft
                </p>
                <p className="text-4xl font-bold text-gray-600 mt-2">
                  {stats.draft}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <Settings className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Undangan Terbaru
            </h2>
            <Link
              href="/create"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
            >
              <Plus className="w-4 h-4" />
              Buat Undangan Baru
            </Link>
          </div>
          <InvitationList />
        </div>
      </div>
    </div>
  );
}

function InvitationList() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInvitations() {
      try {
        const res = await fetch("/api/invitations");
        const data = await res.json();
        setInvitations(data);
      } catch (error) {
        console.error("Failed to fetch invitations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchInvitations();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Belum ada undangan</p>
        <Link
          href="/create"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Buat Undangan Pertama
        </Link>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {invitations.map((invitation) => (
        <div
          key={invitation.id}
          className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                {invitation.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                <span className="font-mono">/{invitation.slug}</span>
                <span>•</span>
                <span>
                  {new Date(invitation.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  invitation.is_active
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-gray-100 text-gray-700 border border-gray-200"
                }`}
              >
                {invitation.is_active ? "Aktif" : "Draft"}
              </span>
              <Link
                href={`/invitation/${invitation.slug}`}
                target="_blank"
                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-150"
              >
                Lihat
              </Link>
              <Link
                href={`/edit/${invitation.slug}`}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                Edit
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

