"use client";

import { analyzeHtml } from "@/lib/editor";

interface HtmlAnalyzerPanelProps {
  htmlContent: string;
}

export function HtmlAnalyzerPanel({ htmlContent }: HtmlAnalyzerPanelProps) {
  const stats = analyzeHtml(htmlContent);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium">Total Tags</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalTags}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 font-medium">Total Elements</div>
          <div className="text-2xl font-bold text-green-900">{stats.totalElements}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">Total Attributes</div>
          <div className="text-2xl font-bold text-purple-900">{stats.totalAttributes}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-sm text-yellow-600 font-medium">Max Depth</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.depth}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-2">Struktur HTML</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              {stats.hasDoctype ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>DOCTYPE</span>
            </div>
            <div className="flex items-center gap-2">
              {stats.hasHtmlTag ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>&lt;html&gt;</span>
            </div>
            <div className="flex items-center gap-2">
              {stats.hasHeadTag ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>&lt;head&gt;</span>
            </div>
            <div className="flex items-center gap-2">
              {stats.hasBodyTag ? (
                <span className="text-green-600">✓</span>
              ) : (
                <span className="text-red-600">✗</span>
              )}
              <span>&lt;body&gt;</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold mb-2">Statistik</h4>
          <div className="space-y-1 text-sm">
            <div>Total Text: {stats.totalText.toLocaleString()} chars</div>
            <div>Total Comments: {stats.totalComments}</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-semibold mb-2">Tag Paling Banyak Digunakan</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(stats.tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 12)
            .map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-mono">&lt;{tag}&gt;</span>
                <span className="text-sm font-semibold text-gray-600">{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

