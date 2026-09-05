"use client";

import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

export default function ThemesPage() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThemes() {
      try {
        const res = await fetch("/api/themes");
        const data = await res.json();
        setThemes(data);
      } catch (error) {
        console.error("Failed to fetch themes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchThemes();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Tema Undangan</h1>
        <p className="text-gray-600">Pilih dan kelola tema untuk undangan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
          >
            <div className="aspect-video bg-gray-200 relative">
              <img
                src={theme.thumbnail_url}
                alt={theme.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {!theme.thumbnail_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Palette className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">{theme.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{theme.description}</p>
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    theme.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {theme.is_active ? "Aktif" : "Nonaktif"}
                </span>
                {theme.category && (
                  <span className="text-xs text-gray-500 capitalize">
                    {theme.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

