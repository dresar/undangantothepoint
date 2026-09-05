"use client";

import { validateHtml } from "@/lib/editor";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

interface HtmlValidatorPanelProps {
  htmlContent: string;
}

export function HtmlValidatorPanel({ htmlContent }: HtmlValidatorPanelProps) {
  const issues = validateHtml(htmlContent);

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      default: return null;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {issues.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-semibold">HTML Valid!</p>
          <p className="text-green-600 text-sm">Tidak ada masalah ditemukan</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 font-medium">Errors</div>
              <div className="text-2xl font-bold text-red-900">{errors.length}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium">Warnings</div>
              <div className="text-2xl font-bold text-yellow-900">{warnings.length}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">Info</div>
              <div className="text-2xl font-bold text-blue-900">{infos.length}</div>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${getBgColor(issue.type)}`}
              >
                <div className="flex items-start gap-2">
                  {getIcon(issue.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.message}</p>
                    {issue.line && (
                      <p className="text-xs text-gray-600 mt-1">Baris: {issue.line}</p>
                    )}
                    {issue.suggestion && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        Saran: {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

