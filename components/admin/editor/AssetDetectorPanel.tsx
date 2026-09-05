"use client";

import { detectAssets } from "@/lib/editor";
import { Image, FileText, Code, Music, Video, File } from "lucide-react";

interface AssetDetectorPanelProps {
  htmlContent: string;
}

export function AssetDetectorPanel({ htmlContent }: AssetDetectorPanelProps) {
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
      case 'image': return <Image className="w-4 h-4" />;
      case 'css': return <FileText className="w-4 h-4" />;
      case 'js': return <Code className="w-4 h-4" />;
      case 'font': return <FileText className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

