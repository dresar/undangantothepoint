"use client";

import { useState, useRef } from "react";
import { Upload, Search, Copy, Check } from "lucide-react";
import { TemplatePreview } from "@/components/admin/TemplatePreview";

interface UploadResponse {
  success: boolean;
  htmlContent: string;
  templateName: string;
}

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith(".zip")) {
      setFile(selectedFile);
    } else {
      alert("Silakan pilih file .zip");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Silakan pilih file terlebih dahulu");
      return;
    }

    if (!templateName.trim()) {
      alert("Silakan masukkan nama template terlebih dahulu");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("templateName", templateName.trim());

    try {
      const response = await fetch("/api/admin/upload-template", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload gagal");
      }

      setUploadData(data);
      setHtmlContent(data.htmlContent);

      alert(`Template "${data.templateName}" berhasil diupload dan disimpan ke database!`);

      if (data.success && data.templateId) {
        setTimeout(() => {
          window.location.href = "/admin/templates";
        }, 1500);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const copyHtmlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      alert("HTML content berhasil di-copy!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const filteredHtml = searchQuery
    ? htmlContent
        .split("\n")
        .map((line) => {
          if (line.toLowerCase().includes(searchQuery.toLowerCase())) {
            return line.replace(
              new RegExp(`(${searchQuery})`, "gi"),
              '<mark style="background-color: #fef08a; padding: 2px 0;">$1</mark>'
            );
          }
          return line;
        })
        .join("\n")
    : htmlContent;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Admin Template Uploader
        </h1>

        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Template ZIP
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Template <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Contoh: templates1, wedding-theme, dll"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={uploading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Nama ini akan digunakan untuk folder template
              </p>
            </div>

            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                disabled={uploading}
              >
                Pilih File ZIP
              </button>
              {file && (
                <span className="text-gray-700">{file.name}</span>
              )}
              {file && templateName.trim() && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {uploading ? "Mengupload..." : "Upload & Proses"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Code Editor & Preview */}
        {uploadData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">HTML Code</h2>
                <button
                  onClick={copyHtmlToClipboard}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition"
                >
                  Copy All
                </button>
              </div>

              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari dalam kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-sm whitespace-pre-wrap">
                  <code dangerouslySetInnerHTML={{ __html: filteredHtml }} />
                </pre>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              <TemplatePreview
                htmlContent={htmlContent || "<p>Preview akan muncul di sini...</p>"}
                cssPaths={[]}
                jsPaths={[]}
                templateId={uploadData?.templateName || ""}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
