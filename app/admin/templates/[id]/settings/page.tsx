"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Settings } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";
import { CDNDetector } from "@/components/admin/CDNDetector";

interface Template {
  id: string;
  name: string;
  description?: string;
  ejs_file_path?: string;
  style_config_json?: any;
}

export default function TemplateSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState<{
    css: string[];
    js: string[];
  }>({ css: [], js: [] });

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/templates/${templateId}?t=${timestamp}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch template");
      }

      setTemplate(data);
      setAssets({
        css: data.style_config_json?.css || [],
        js: data.style_config_json?.js || [],
      });
    } catch (error: any) {
      console.error("Failed to fetch template:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAsset = async (type: "css" | "js", path: string) => {
    if (!template) return;

    const updatedAssets = {
      ...assets,
      [type]: assets[type].filter((p) => p !== path),
    };

    setAssets(updatedAssets);

    // Update di database
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...template,
          style_config_json: {
            ...template.style_config_json,
            ...updatedAssets,
          },
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      toast.success("Asset berhasil dihapus");
      fetchTemplate(); // Refresh
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      // Revert on error
      setAssets({
        css: template.style_config_json?.css || [],
        js: template.style_config_json?.js || [],
      });
    }
  };

  const handleReplaceWithCDN = async (
    type: "css" | "js",
    oldPath: string,
    cdnLink: string
  ) => {
    if (!template) return;

    const updatedAssets = {
      ...assets,
      [type]: assets[type].map((p) => (p === oldPath ? cdnLink : p)),
    };

    setAssets(updatedAssets);

    // Update di database
    try {
      const res = await fetch(`/api/admin/templates/${templateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...template,
          style_config_json: {
            ...template.style_config_json,
            ...updatedAssets,
          },
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      toast.success("Asset berhasil diganti dengan CDN");
      fetchTemplate(); // Refresh
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      // Revert on error
      setAssets({
        css: template.style_config_json?.css || [],
        js: template.style_config_json?.js || [],
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Template tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-8 h-8" />
              Template Settings: {template.name}
            </h1>
            <p className="text-gray-600 mt-1">{template.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">CDN Detector & Asset Manager</h2>
          <CDNDetector
            templateId={templateId}
            assets={assets}
            onRemoveAsset={handleRemoveAsset}
            onReplaceWithCDN={handleReplaceWithCDN}
          />
        </div>
      </div>
    </div>
  );
}

