"use client";

import { useState, useEffect } from "react";
import { X, Code2, Sparkles, Copy, Check, BarChart3, Trash2, AlertTriangle, FileCode } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  formatHtml,
  cleanHtml,
  analyzeHtml,
} from "@/lib/editor";
import { cleanMetaTags } from "@/lib/editor/htmlMetaCleaner";
import { ErrorModal } from "./ErrorModal";
import { AssetModal } from "./AssetModal";

interface HtmlToolsModalProps {
  htmlContent: string;
  onHtmlChange: (newHtml: string) => void;
  onClose: () => void;
}

export function HtmlToolsModal({ htmlContent, onHtmlChange, onClose }: HtmlToolsModalProps) {
  const [processedHtml, setProcessedHtml] = useState(htmlContent);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);

  useEffect(() => {
    setProcessedHtml(htmlContent);
  }, [htmlContent]);

  // Calculate stats
  const stats = analyzeHtml(processedHtml);

  const handleFormat = () => {
    setLoading(true);
    try {
      const result = formatHtml(processedHtml, {
        indentSize: 2,
        preserveComments: false,
        removeEmptyLines: true,
      });

      setProcessedHtml(result);
      toast.success("HTML berhasil di-format! Indentasi sudah dirapikan.");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClean = () => {
    setLoading(true);
    try {
      // Clean HTML (hapus komentar, atribut kosong, padatkan spasi)
      let result = cleanHtml(processedHtml, {
        removeComments: true,
        removeEmptyAttributes: true,
        removeEventHandlers: false,
        removeInlineStyles: false,
        removeDataAttributes: false,
        minify: false,
      });

      // Clean external meta tags
      result = cleanMetaTags(result, {
        removeExternalUrls: true,
        defaultDomain: typeof window !== 'undefined' ? window.location.origin : '',
        removeOgTags: false,
        removeItemprop: false,
      });

      setProcessedHtml(result);
      toast.success("HTML berhasil dibersihkan! Komentar dihapus, spasi dipadatkan, desain tetap aman.");
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onHtmlChange(processedHtml);
    toast.success("Perubahan diterapkan ke editor!");
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(processedHtml);
      setCopied(true);
      toast.success("HTML disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Gagal menyalin HTML");
    }
  };

  const handleReset = () => {
    setProcessedHtml(htmlContent);
    toast.success("HTML di-reset ke versi asli");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Code2 className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold">HTML Tools</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b bg-gray-50">
          <button
            onClick={handleFormat}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Memproses..." : "Format"}
          </button>
          <button
            onClick={handleClean}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {loading ? "Memproses..." : "Clean"}
          </button>
          <button
            onClick={() => setShowErrorModal(true)}
            className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition flex items-center gap-2 text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Error
          </button>
          <button
            onClick={() => setShowAssetModal(true)}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm"
          >
            <FileCode className="w-4 h-4" />
            Asset
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2 text-sm"
            title={showInfo ? "Sembunyikan Info" : "Tampilkan Info"}
          >
            <BarChart3 className="w-4 h-4" />
            {showInfo ? "Sembunyikan" : "Info"}
          </button>
          <div className="flex-1" />
          <button
            onClick={handleReset}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Reset
          </button>
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2 text-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy
          </button>
        </div>

        {/* Info Box */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Format:</strong> Merapikan indentasi HTML. <strong>Clean:</strong> Membersihkan komentar, menghapus atribut kosong, dan memadatkan spasi tanpa merusak desain.
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Editor */}
          <div className={`flex-1 overflow-auto p-4 transition-all ${showInfo ? '' : ''}`}>
            <textarea
              value={processedHtml}
              onChange={(e) => setProcessedHtml(e.target.value)}
              className="w-full h-full font-mono text-sm border border-gray-300 rounded p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              style={{ minHeight: '400px' }}
              placeholder="HTML content akan muncul di sini..."
            />
          </div>

          {/* Info Sidebar */}
          {showInfo && (
            <div className="w-80 border-l bg-gray-50 overflow-y-auto flex-shrink-0">
              <div className="p-4 space-y-4">
                {/* Stats Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-sm">Statistik</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="text-xs text-blue-600 font-medium">Total Tags</div>
                      <div className="text-xl font-bold text-blue-900">{stats.totalTags}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <div className="text-xs text-green-600 font-medium">Elements</div>
                      <div className="text-xl font-bold text-green-900">{stats.totalElements}</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded border border-purple-200">
                      <div className="text-xs text-purple-600 font-medium">Attributes</div>
                      <div className="text-xl font-bold text-purple-900">{stats.totalAttributes}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <div className="text-xs text-yellow-600 font-medium">Depth</div>
                      <div className="text-xl font-bold text-yellow-900">{stats.depth}</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Batal
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Terapkan ke Editor
          </button>
        </div>
      </div>

      {/* Error Modal */}
      {showErrorModal && (
        <ErrorModal
          htmlContent={processedHtml}
          onClose={() => setShowErrorModal(false)}
          onRepaired={(repairedHtml) => {
            setProcessedHtml(repairedHtml);
            setShowErrorModal(false);
          }}
        />
      )}

      {/* Asset Modal */}
      {showAssetModal && (
        <AssetModal
          htmlContent={processedHtml}
          onClose={() => setShowAssetModal(false)}
        />
      )}
    </div>
  );
}

