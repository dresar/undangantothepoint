"use client";

import { X } from "lucide-react";

interface FormatOptions {
  indentSize: number;
  preserveComments: boolean;
  removeEmptyLines: boolean;
}

interface HtmlFormatterSettingsProps {
  options: FormatOptions;
  onOptionsChange: (options: FormatOptions) => void;
  onClose: () => void;
}

export function HtmlFormatterSettings({
  options,
  onOptionsChange,
  onClose,
}: HtmlFormatterSettingsProps) {
  return (
    <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Pengaturan Format</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ukuran Indent
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={options.indentSize}
            onChange={(e) =>
              onOptionsChange({
                ...options,
                indentSize: parseInt(e.target.value) || 2,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.preserveComments}
              onChange={(e) =>
                onOptionsChange({
                  ...options,
                  preserveComments: e.target.checked,
                })
              }
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Preserve Comments</span>
          </label>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={options.removeEmptyLines}
              onChange={(e) =>
                onOptionsChange({
                  ...options,
                  removeEmptyLines: e.target.checked,
                })
              }
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Hapus Baris Kosong</span>
          </label>
        </div>
      </div>
    </div>
  );
}

