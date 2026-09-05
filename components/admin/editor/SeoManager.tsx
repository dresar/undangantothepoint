"use client";

import { useState, useEffect } from "react";
import { X, Save, Globe, Search, Image as ImageIcon } from "lucide-react";
import { toast } from "react-hot-toast";

interface SeoConfig {
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
}

interface SeoManagerProps {
  templateId: string;
  htmlContent: string;
  onClose: () => void;
}

export function SeoManager({ templateId, htmlContent, onClose }: SeoManagerProps) {
  const [seoConfig, setSeoConfig] = useState<SeoConfig>({
    title: "",
    description: "",
    keywords: "",
    ogTitle: "",
    ogDescription: "",
    ogImage: "",
    ogUrl: "",
    ogType: "website",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSeoConfig();
  }, [templateId]);

  const fetchSeoConfig = async () => {
    try {
      const res = await fetch(`/api/admin/templates/${templateId}/seo`);
      if (res.ok) {
        const data = await res.json();
        if (data.seoConfig) {
          setSeoConfig(data.seoConfig);
        } else {
          // Extract from HTML if not in database
          extractSeoFromHtml();
        }
      }
    } catch (error) {
      console.error("Error fetching SEO config:", error);
      extractSeoFromHtml();
    } finally {
      setLoading(false);
    }
  };

  const extractSeoFromHtml = () => {
    // Extract title
    const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      setSeoConfig(prev => ({ ...prev, title: titleMatch[1] }));
    }

    // Extract meta description
    const descMatch = htmlContent.match(/<meta\s+name\s*=\s*["']description["']\s+content\s*=\s*["']([^"']+)["']/i);
    if (descMatch) {
      setSeoConfig(prev => ({ ...prev, description: descMatch[1] }));
    }

    // Extract og:title
    const ogTitleMatch = htmlContent.match(/<meta\s+property\s*=\s*["']og:title["']\s+content\s*=\s*["']([^"']+)["']/i);
    if (ogTitleMatch) {
      setSeoConfig(prev => ({ ...prev, ogTitle: ogTitleMatch[1] }));
    }

    // Extract og:description
    const ogDescMatch = htmlContent.match(/<meta\s+property\s*=\s*["']og:description["']\s+content\s*=\s*["']([^"']+)["']/i);
    if (ogDescMatch) {
      setSeoConfig(prev => ({ ...prev, ogDescription: ogDescMatch[1] }));
    }

    // Extract og:image
    const ogImageMatch = htmlContent.match(/<meta\s+property\s*=\s*["']og:image["']\s+content\s*=\s*["']([^"']+)["']/i);
    if (ogImageMatch) {
      setSeoConfig(prev => ({ ...prev, ogImage: ogImageMatch[1] }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/templates/${templateId}/seo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ seoConfig }),
      });

      if (!res.ok) {
        throw new Error("Failed to save SEO config");
      }

      toast.success("SEO config berhasil disimpan!");
      onClose();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">SEO Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Title
            </label>
            <input
              type="text"
              value={seoConfig.title}
              onChange={(e) => setSeoConfig(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Page title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={seoConfig.description}
              onChange={(e) => setSeoConfig(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="Meta description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={seoConfig.keywords}
              onChange={(e) => setSeoConfig(prev => ({ ...prev, keywords: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="keyword1, keyword2, keyword3"
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Open Graph (Facebook/Social Media)</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG Title
                </label>
                <input
                  type="text"
                  value={seoConfig.ogTitle}
                  onChange={(e) => setSeoConfig(prev => ({ ...prev, ogTitle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG Description
                </label>
                <textarea
                  value={seoConfig.ogDescription}
                  onChange={(e) => setSeoConfig(prev => ({ ...prev, ogDescription: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  OG Image URL
                </label>
                <input
                  type="text"
                  value={seoConfig.ogImage}
                  onChange={(e) => setSeoConfig(prev => ({ ...prev, ogImage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="/images/og-image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG URL
                </label>
                <input
                  type="text"
                  value={seoConfig.ogUrl}
                  onChange={(e) => setSeoConfig(prev => ({ ...prev, ogUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Will use current domain automatically"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OG Type
                </label>
                <select
                  value={seoConfig.ogType}
                  onChange={(e) => setSeoConfig(prev => ({ ...prev, ogType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="website">Website</option>
                  <option value="article">Article</option>
                  <option value="product">Product</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

