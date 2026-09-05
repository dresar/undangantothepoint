"use client";

import { useState, useEffect } from "react";
import { X, Copy, Check, Image as ImageIcon, AlertCircle, SaveAll } from "lucide-react";
import { toast } from "react-hot-toast";

interface SvgExtractorProps {
  htmlContent: string;
  templateId: string;
  templateName: string;
  onSvgExtracted: (originalSvg: string, replacement: string) => void;
  onMassExtract?: (updatedHtml: string) => void; // New callback for mass extraction
  onClose: () => void;
}

export function SvgExtractor({
  htmlContent,
  templateId,
  templateName,
  onSvgExtracted,
  onMassExtract,
  onClose,
}: SvgExtractorProps) {
  const [detectedSvgs, setDetectedSvgs] = useState<Array<{ content: string; index: number }>>([]);
  const [selectedSvg, setSelectedSvg] = useState<string>("");
  const [filename, setFilename] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Detect all SVG elements in HTML
    const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
    const matches: Array<{ content: string; index: number }> = [];
    let match;

    while ((match = svgRegex.exec(htmlContent)) !== null) {
      matches.push({
        content: match[0],
        index: match.index,
      });
    }

    setDetectedSvgs(matches);
    
    // Auto-select first SVG if available
    if (matches.length > 0 && !selectedSvg) {
      setSelectedSvg(matches[0].content);
      // Generate default filename from SVG attributes
      const svgMatch = matches[0].content.match(/<svg[^>]*>/i);
      if (svgMatch) {
        const widthMatch = svgMatch[0].match(/width=["'](\d+)["']/i);
        const heightMatch = svgMatch[0].match(/height=["'](\d+)["']/i);
        const viewBoxMatch = svgMatch[0].match(/viewBox=["']([^"']+)["']/i);
        
        let defaultName = "icon";
        if (widthMatch && heightMatch) {
          defaultName = `icon-${widthMatch[1]}x${heightMatch[1]}`;
        } else if (viewBoxMatch) {
          defaultName = "icon-svg";
        }
        setFilename(`${defaultName}-${Date.now()}.svg`);
      } else {
        setFilename(`icon-${Date.now()}.svg`);
      }
    }
  }, [htmlContent]);

  const handleSave = async () => {
    if (!selectedSvg || !filename.trim()) {
      toast.error("SVG dan nama file harus diisi");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/save-svg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId,
          svgContent: selectedSvg,
          filename: filename.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal menyimpan SVG");
      }

      // Generate replacement HTML
      const replacement = `<img src="${data.shortUrl}" alt="" style="width: inherit; height: inherit;">`;
      
      // Callback to replace SVG in HTML
      onSvgExtracted(selectedSvg, replacement);
      
      setSavedUrl(data.shortUrl);
      toast.success("SVG berhasil disimpan!");
    } catch (error: any) {
      console.error("Error saving SVG:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!savedUrl) return;
    
    try {
      await navigator.clipboard.writeText(savedUrl);
      setCopied(true);
      toast.success("URL berhasil di-copy!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Gagal menyalin URL");
    }
  };

  const handleSaveAll = async () => {
    if (detectedSvgs.length === 0) {
      toast.error("Tidak ada SVG untuk diekstrak");
      return;
    }

    setSavingAll(true);
    try {
      toast.loading(`Mengekstrak ${detectedSvgs.length} SVG secara massal...`, { id: "mass-extract" });

      const response = await fetch("/api/admin/extract-all-svgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId,
          htmlContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengekstrak semua SVG");
      }

      if (data.extractedCount > 0) {
        toast.success(
          `${data.extractedCount} SVG berhasil diekstrak dan diganti secara massal!`,
          { id: "mass-extract", duration: 4000 }
        );

        // Call callback to update HTML content in editor
        if (onMassExtract) {
          onMassExtract(data.htmlContent);
        }

        // Close modal after successful mass extraction
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        toast.dismiss("mass-extract");
        toast.error("Tidak ada SVG yang berhasil diekstrak");
      }
    } catch (error: any) {
      console.error("Error mass extracting SVGs:", error);
      toast.error(`Error: ${error.message}`, { id: "mass-extract" });
    } finally {
      setSavingAll(false);
    }
  };

  if (detectedSvgs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold">Tidak Ada SVG Ditemukan</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Tidak ada kode SVG yang ditemukan dalam HTML. Pastikan kode SVG sudah ada di editor.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Ekstrak SVG ke File</h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
              {detectedSvgs.length} SVG ditemukan
            </span>
            {detectedSvgs.length > 1 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                Gunakan "Simpan Semua" untuk ekstraksi massal
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Mass Extract Info */}
          {detectedSvgs.length > 1 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <SaveAll className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Ekstraksi Massal Tersedia
                  </p>
                  <p className="text-xs text-green-700">
                    Klik tombol <strong>"Simpan Semua ({detectedSvgs.length})"</strong> di bawah untuk mengekstrak dan mengganti semua SVG sekaligus secara otomatis. Semua SVG akan disimpan ke folder <code className="bg-white px-1 rounded">media/</code> dan diganti dengan tag <code className="bg-white px-1 rounded">&lt;img&gt;</code> di HTML.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SVG Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih SVG untuk Ekstraksi Manual ({detectedSvgs.length} ditemukan)
            </label>
            <select
              value={detectedSvgs.findIndex(s => s.content === selectedSvg)}
              onChange={(e) => {
                const index = parseInt(e.target.value);
                setSelectedSvg(detectedSvgs[index].content);
                setSavedUrl(null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {detectedSvgs.map((svg, index) => (
                <option key={index} value={index}>
                  SVG #{index + 1} (Baris ~{Math.floor(svg.index / 80) + 1})
                </option>
              ))}
            </select>
          </div>

          {/* SVG Preview */}
          {selectedSvg && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview SVG
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-48 overflow-auto">
                <div dangerouslySetInnerHTML={{ __html: selectedSvg }} />
              </div>
            </div>
          )}

          {/* SVG Code */}
          {selectedSvg && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode SVG
              </label>
              <textarea
                value={selectedSvg}
                onChange={(e) => setSelectedSvg(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={8}
                readOnly
              />
            </div>
          )}

          {/* Filename Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama File <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="contoh: icon-menu.svg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              File akan disimpan di: <code className="bg-gray-100 px-1 rounded">media/{filename || "icon.svg"}</code>
            </p>
          </div>

          {/* Saved URL */}
          {savedUrl && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">SVG Berhasil Disimpan!</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border border-green-200 text-sm">
                  {savedUrl}
                </code>
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-600">
                Gunakan URL ini untuk mengganti SVG inline di HTML: <code className="bg-white px-1 rounded">{`<img src="${savedUrl}" alt="">`}</code>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            {detectedSvgs.length > 1 && (
              <button
                onClick={handleSaveAll}
                disabled={savingAll || saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                title={`Ekstrak semua ${detectedSvgs.length} SVG sekaligus`}
              >
                <SaveAll className="w-4 h-4" />
                {savingAll ? `Mengekstrak ${detectedSvgs.length} SVG...` : `Simpan Semua (${detectedSvgs.length})`}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving || savingAll || !selectedSvg || !filename.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? "Menyimpan..." : "Simpan SVG"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

