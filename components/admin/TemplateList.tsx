"use client";

import { useState, useEffect } from "react";
import { Search, Trash2, Edit, Eye, Download, Upload, RefreshCw, X, Code, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  thumbnail_url?: string;
  ejs_file_path?: string;
}

export function TemplateList() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Tambahkan cache busting dengan timestamp
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/templates?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      const data = await res.json();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
      alert("Gagal memuat template");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus template "${template.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus template");
      }

      alert("Template berhasil dihapus");
      // Force refresh dengan delay kecil untuk memastikan database sudah update
      setTimeout(() => {
        fetchTemplates();
      }, 100);
      setDeletingTemplate(null);
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || "",
      category: template.category || "",
      is_active: template.is_active,
    });
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;

    try {
      const res = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(editForm),
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengupdate template");
      }

      alert("Template berhasil diupdate");
      // Force refresh dengan delay kecil untuk memastikan database sudah update
      setTimeout(() => {
        fetchTemplates();
      }, 100);
      setEditingTemplate(null);
    } catch (error: any) {
      console.error("Update error:", error);
      alert(`Error: ${error.message}`);
    }
  };

  const handlePreview = (template: Template) => {
    if (template.ejs_file_path) {
      window.open(template.ejs_file_path, "_blank");
    } else {
      alert("Preview tidak tersedia untuk template ini");
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTemplates}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <Link
            href="/admin/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Template
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                )}
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  template.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {template.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>

            {template.category && (
              <div className="mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {template.category}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => {
                  setNavigatingTo(`/admin/templates/${template.id}/editor`);
                  router.push(`/admin/templates/${template.id}/editor`);
                }}
                disabled={navigatingTo === `/admin/templates/${template.id}/editor`}
                className="p-2 hover:bg-blue-100 rounded transition disabled:opacity-50 disabled:cursor-wait"
                title="Editor"
              >
                {navigatingTo === `/admin/templates/${template.id}/editor` ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Code className="w-4 h-4 text-blue-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setNavigatingTo(`/admin/templates/${template.id}/settings`);
                  router.push(`/admin/templates/${template.id}/settings`);
                }}
                disabled={navigatingTo === `/admin/templates/${template.id}/settings`}
                className="p-2 hover:bg-purple-100 rounded transition disabled:opacity-50 disabled:cursor-wait"
                title="Settings"
              >
                {navigatingTo === `/admin/templates/${template.id}/settings` ? (
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Settings className="w-4 h-4 text-purple-600" />
                )}
              </button>
              <button
                onClick={() => handlePreview(template)}
                className="p-2 hover:bg-gray-100 rounded transition"
                title="Preview"
              >
                <Eye className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => handleEdit(template)}
                className="p-2 hover:bg-gray-100 rounded transition"
                title="Edit"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => handleDelete(template)}
                className="p-2 hover:bg-red-100 rounded transition ml-auto"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Tidak ada template ditemukan</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit Template</h2>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Template
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Pilih Kategori</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                  <option value="traditional">Traditional</option>
                  <option value="minimalist">Minimalist</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm font-medium text-gray-700">Aktif</label>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={handleUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setEditingTemplate(null)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

