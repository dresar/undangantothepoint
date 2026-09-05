"use client";

import { useState, useEffect } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";

interface TemplatePreviewProps {
  htmlContent: string;
  cssPaths?: string[];
  jsPaths?: string[];
  templateId?: string;
  onClose?: () => void;
}

export function TemplatePreview({
  htmlContent,
  cssPaths = [],
  jsPaths = [],
  templateId,
  onClose,
}: TemplatePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Generate preview menggunakan data URL dengan base64
  useEffect(() => {
    if (!htmlContent) {
      setPreviewUrl(null);
      return;
    }

    const generatePreview = async () => {
      try {
        // Buat HTML lengkap dengan CSS dan JS
        let fullHtml = htmlContent || "";

        // Pastikan ada struktur HTML dasar
        if (!fullHtml.includes("<!DOCTYPE") && !fullHtml.includes("<html")) {
          fullHtml = `<!DOCTYPE html>\n<html lang="id">\n${fullHtml}\n</html>`;
        }

        // Pastikan ada <head> dan <body> tags
        if (!fullHtml.includes("<head>")) {
          if (fullHtml.includes("<html")) {
            fullHtml = fullHtml.replace("<html", "<html>\n<head></head>");
          } else {
            fullHtml = `<head></head>\n${fullHtml}`;
          }
        }
        
        if (!fullHtml.includes("<body>")) {
          if (fullHtml.includes("</head>")) {
            fullHtml = fullHtml.replace("</head>", "</head>\n<body>");
          } else {
            fullHtml = `${fullHtml}\n<body>`;
          }
          if (!fullHtml.includes("</body>")) {
            fullHtml = `${fullHtml}\n</body>`;
          }
        }

        // Inject base tag dengan template path
        const baseHref = templateId ? `/templates/${templateId}/` : "/";
        const baseTag = `<base href="${baseHref}">`;
        if (fullHtml.includes("<base")) {
          fullHtml = fullHtml.replace(/<base[^>]*>/, baseTag);
        } else {
          if (fullHtml.includes("</head>")) {
            fullHtml = fullHtml.replace("</head>", `    ${baseTag}\n</head>`);
          } else if (fullHtml.includes("<head>")) {
            fullHtml = fullHtml.replace("<head>", `<head>\n    ${baseTag}`);
          } else if (fullHtml.includes("<html")) {
            fullHtml = fullHtml.replace("<html", `<html>\n<head>\n    ${baseTag}\n</head>`);
          } else {
            fullHtml = `<head>\n    ${baseTag}\n</head>\n${fullHtml}`;
          }
        }

        // Inject CSS sebelum </head>
        if (cssPaths && cssPaths.length > 0) {
          const cssLinks = cssPaths
            .map((path: string) => {
              const absolutePath = path.startsWith("/") ? path : `/${path}`;
              return `    <link rel="stylesheet" href="${absolutePath}">`;
            })
            .join("\n");
          
          if (fullHtml.includes("</head>")) {
            fullHtml = fullHtml.replace("</head>", `${cssLinks}\n</head>`);
          } else if (fullHtml.includes("<head>")) {
            fullHtml = fullHtml.replace("<head>", `<head>\n${cssLinks}`);
          }
        }

        // Inject JS sebelum </body>
        if (jsPaths && jsPaths.length > 0) {
          const jsScripts = jsPaths
            .map((path: string) => {
              const absolutePath = path.startsWith("/") ? path : `/${path}`;
              return `    <script src="${absolutePath}"></script>`;
            })
            .join("\n");
          
          if (fullHtml.includes("</body>")) {
            fullHtml = fullHtml.replace("</body>", `${jsScripts}\n</body>`);
          } else {
            fullHtml = `${fullHtml}\n${jsScripts}`;
          }
        }

        // Gunakan data URL dengan base64 encoding
        const base64Html = btoa(unescape(encodeURIComponent(fullHtml)));
        const dataUrl = `data:text/html;base64,${base64Html}`;
        setPreviewUrl(dataUrl);
      } catch (error) {
        console.error("Preview generation error:", error);
        setPreviewUrl(null);
      }
    };

    generatePreview();
  }, [htmlContent, cssPaths, jsPaths, templateId]);

  return (
    <div
      className={`bg-white rounded-lg shadow-xl border border-gray-200 ${
        isFullscreen ? "fixed inset-4 z-50" : "relative"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Template Preview</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-auto" style={{ height: isFullscreen ? "calc(100vh - 8rem)" : "600px" }}>
        {previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Template Preview"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Loading preview...</p>
          </div>
        )}
      </div>
    </div>
  );
}

