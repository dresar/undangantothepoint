"use client";

import { X, FileCode, Image, FileText, Code, Music, Video, File } from "lucide-react";
import { detectAssets } from "@/lib/editor";

interface AssetModalProps {
  htmlContent: string;
  onClose: () => void;
}

export function AssetModal({ htmlContent, onClose }: AssetModalProps) {
  const assets = detectAssets(htmlContent);

  const assetsByType = {
    image: assets.filter(a => a.type === 'image'),
    css: assets.filter(a => a.type === 'css'),
    js: assets.filter(a => a.type === 'js'),
    font: assets.filter(a => a.type === 'font'),
    video: assets.filter(a => a.type === 'video'),
    audio: assets.filter(a => a.type === 'audio'),
    other: assets.filter(a => a.type === 'other'),
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5 text-blue-600" />;
      case 'css': return <FileText className="w-5 h-5 text-green-600" />;
      case 'js': return <Code className="w-5 h-5 text-purple-600" />;
      case 'font': return <FileText className="w-5 h-5 text-yellow-600" />;
      case 'video': return <Video className="w-5 h-5 text-red-600" />;
      case 'audio': return <Music className="w-5 h-5 text-pink-600" />;
      default: return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileCode className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Deteksi Asset</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Image className="w-5 h-5 text-blue-600" />
                <div className="text-sm text-blue-600 font-medium">Images</div>
              </div>
              <div className="text-2xl font-bold text-blue-900">{assetsByType.image.length}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-green-600" />
                <div className="text-sm text-green-600 font-medium">CSS</div>
              </div>
              <div className="text-2xl font-bold text-green-900">{assetsByType.css.length}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <Code className="w-5 h-5 text-purple-600" />
                <div className="text-sm text-purple-600 font-medium">JavaScript</div>
              </div>
              <div className="text-2xl font-bold text-purple-900">{assetsByType.js.length}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-5 h-5 text-yellow-600" />
                <div className="text-sm text-yellow-600 font-medium">Fonts</div>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{assetsByType.font.length}</div>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(assetsByType).map(([type, typeAssets]) => {
              if (typeAssets.length === 0) return null;
              return (
                <div key={type} className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {getIcon(type)}
                    <span className="capitalize">{type}</span>
                    <span className="text-sm text-gray-500">({typeAssets.length})</span>
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {typeAssets.map((asset, idx) => (
                      <div key={idx} className="text-sm p-2 bg-gray-50 rounded font-mono break-all">
                        {asset.url}
                        {asset.line && (
                          <span className="text-xs text-gray-500 ml-2">(Baris: {asset.line})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {assets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileCode className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Tidak ada asset ditemukan</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

