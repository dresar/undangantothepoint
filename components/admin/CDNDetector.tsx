"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Download, Trash2, Check, X, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface CDNMatch {
  library: string;
  version?: string;
  cdnLinks: {
    jsdelivr?: string;
    unpkg?: string;
    cdnjs?: string;
    js?: string;
    css?: string;
  };
  detected: boolean;
  confidence: number;
}

interface AssetAnalysis {
  path: string;
  isCDN: boolean;
  detectedLibraries: CDNMatch[];
  fileSize: number;
  exists: boolean;
  cdnInfo?: {
    name: string;
    version?: string;
  };
}

interface CDNDetectorProps {
  templateId: string;
  assets: {
    css: string[];
    js: string[];
  };
  onRemoveAsset?: (type: "css" | "js", path: string) => void;
  onReplaceWithCDN?: (type: "css" | "js", oldPath: string, cdnLink: string) => void;
}

export function CDNDetector({
  templateId,
  assets,
  onRemoveAsset,
  onReplaceWithCDN,
}: CDNDetectorProps) {
  const [analysis, setAnalysis] = useState<{
    css: AssetAnalysis[];
    js: AssetAnalysis[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCDN, setSelectedCDN] = useState<{
    type: "css" | "js";
    path: string;
    cdnLink: string;
  } | null>(null);

  useEffect(() => {
    fetchAnalysis();
  }, [templateId]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/templates/${templateId}/analyze-assets`, {
        cache: "no-store",
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (error) {
      console.error("Failed to fetch analysis:", error);
      toast.error("Gagal menganalisis assets");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (type: "css" | "js", path: string) => {
    if (confirm(`Hapus ${type.toUpperCase()} file ini?`)) {
      onRemoveAsset?.(type, path);
      toast.success("Asset berhasil dihapus");
    }
  };

  const handleReplaceWithCDN = (type: "css" | "js", oldPath: string, cdnLink: string) => {
    if (confirm(`Ganti dengan CDN link ini?`)) {
      onReplaceWithCDN?.(type, oldPath, cdnLink);
      toast.success("Asset diganti dengan CDN");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analysis) {
    return <div className="text-gray-500">Tidak ada data analisis</div>;
  }

  return (
    <div className="space-y-6">
      {/* CSS Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">CSS Files Analysis</h3>
        <div className="space-y-3">
          {analysis.css.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm text-gray-700">{item.path}</code>
                    {item.isCDN && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        CDN
                      </span>
                    )}
                    {!item.exists && !item.isCDN && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        File tidak ditemukan
                      </span>
                    )}
                  </div>
                  {item.fileSize > 0 && (
                    <div className="text-xs text-gray-500">
                      Size: {formatFileSize(item.fileSize)}
                    </div>
                  )}
                </div>
                {!item.isCDN && (
                  <button
                    onClick={() => handleRemove("css", item.path)}
                    className="p-2 hover:bg-red-100 rounded transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>

              {/* Detected Libraries */}
              {item.detectedLibraries.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    Library Terdeteksi:
                  </div>
                  {item.detectedLibraries.map((lib, libIdx) => (
                    <div
                      key={libIdx}
                      className="bg-blue-50 border border-blue-200 rounded p-3 mb-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-blue-900">{lib.library}</span>
                          {lib.version && (
                            <span className="text-xs text-blue-700 ml-2">v{lib.version}</span>
                          )}
                          <span className="text-xs text-blue-600 ml-2">
                            ({lib.confidence}% confidence)
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {lib.cdnLinks.css && (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-white px-2 py-1 rounded flex-1">
                              {lib.cdnLinks.css}
                            </code>
                            <button
                              onClick={() =>
                                handleReplaceWithCDN("css", item.path, lib.cdnLinks.css!)
                              }
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Ganti dengan CDN
                            </button>
                            <a
                              href={lib.cdnLinks.css}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-blue-100 rounded"
                            >
                              <ExternalLink className="w-3 h-3 text-blue-600" />
                            </a>
                          </div>
                        )}
                        {lib.cdnLinks.jsdelivr && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-20">jsDelivr:</span>
                            <code className="text-xs bg-white px-2 py-1 rounded flex-1">
                              {lib.cdnLinks.jsdelivr}
                            </code>
                            <a
                              href={lib.cdnLinks.jsdelivr}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-blue-100 rounded"
                            >
                              <ExternalLink className="w-3 h-3 text-blue-600" />
                            </a>
                          </div>
                        )}
                        {lib.cdnLinks.cdnjs && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-20">CDNJS:</span>
                            <code className="text-xs bg-white px-2 py-1 rounded flex-1">
                              {lib.cdnLinks.cdnjs}
                            </code>
                            <a
                              href={lib.cdnLinks.cdnjs}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-blue-100 rounded"
                            >
                              <ExternalLink className="w-3 h-3 text-blue-600" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CDN Info */}
              {item.isCDN && item.cdnInfo && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    CDN Info:
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.cdnInfo.name} {item.cdnInfo.version && `v${item.cdnInfo.version}`}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* JS Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">JS Files Analysis</h3>
        <div className="space-y-3">
          {analysis.js.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm text-gray-700">{item.path}</code>
                    {item.isCDN && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        CDN
                      </span>
                    )}
                    {!item.exists && !item.isCDN && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        File tidak ditemukan
                      </span>
                    )}
                  </div>
                  {item.fileSize > 0 && (
                    <div className="text-xs text-gray-500">
                      Size: {formatFileSize(item.fileSize)}
                    </div>
                  )}
                </div>
                {!item.isCDN && (
                  <button
                    onClick={() => handleRemove("js", item.path)}
                    className="p-2 hover:bg-red-100 rounded transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>

              {/* Detected Libraries */}
              {item.detectedLibraries.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    Library Terdeteksi:
                  </div>
                  {item.detectedLibraries.map((lib, libIdx) => (
                    <div
                      key={libIdx}
                      className="bg-blue-50 border border-blue-200 rounded p-3 mb-2"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-semibold text-blue-900">{lib.library}</span>
                          {lib.version && (
                            <span className="text-xs text-blue-700 ml-2">v{lib.version}</span>
                          )}
                          <span className="text-xs text-blue-600 ml-2">
                            ({lib.confidence}% confidence)
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {lib.cdnLinks.js && (
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-white px-2 py-1 rounded flex-1">
                              {lib.cdnLinks.js}
                            </code>
                            <button
                              onClick={() =>
                                handleReplaceWithCDN("js", item.path, lib.cdnLinks.js!)
                              }
                              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              Ganti dengan CDN
                            </button>
                            <a
                              href={lib.cdnLinks.js}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-blue-100 rounded"
                            >
                              <ExternalLink className="w-3 h-3 text-blue-600" />
                            </a>
                          </div>
                        )}
                        {lib.cdnLinks.jsdelivr && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-20">jsDelivr:</span>
                            <code className="text-xs bg-white px-2 py-1 rounded flex-1">
                              {lib.cdnLinks.jsdelivr}
                            </code>
                            <a
                              href={lib.cdnLinks.jsdelivr}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-blue-100 rounded"
                            >
                              <ExternalLink className="w-3 h-3 text-blue-600" />
                            </a>
                          </div>
                        )}
                        {lib.cdnLinks.cdnjs && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-20">CDNJS:</span>
                            <code className="text-xs bg-white px-2 py-1 rounded flex-1">
                              {lib.cdnLinks.cdnjs}
                            </code>
                            <a
                              href={lib.cdnLinks.cdnjs}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-blue-100 rounded"
                            >
                              <ExternalLink className="w-3 h-3 text-blue-600" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* CDN Info */}
              {item.isCDN && item.cdnInfo && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    CDN Info:
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.cdnInfo.name} {item.cdnInfo.version && `v${item.cdnInfo.version}`}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

