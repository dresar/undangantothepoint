"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Save, FileCode, Smartphone, Image as ImageIcon, Search, Sparkles, X } from "lucide-react";
import { HistoryManager } from "@/components/admin/editor/HistoryManager";
import { Toaster, toast } from "react-hot-toast";
import { ResizablePanel } from "@/components/admin/ResizablePanel";
import { SvgExtractor } from "@/components/admin/SvgExtractor";
import { HtmlTools } from "@/components/admin/editor/HtmlTools";
import { SeoManager } from "@/components/admin/editor/SeoManager";
import { CodeSearch } from "@/components/admin/editor/CodeSearch";
import { AIAssistant } from "@/components/admin/editor/AIAssistant";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Template {
  id: string;
  name: string;
  description?: string;
  ejs_file_path?: string;
  style_config_json?: any;
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [htmlContent, setHtmlContent] = useState("<!DOCTYPE html>\n<html>\n<head></head>\n<body>\n  <h1>Loading...</h1>\n</body>\n</html>");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorSize, setEditorSize] = useState(70);
  const [previewUrl, setPreviewUrl] = useState("");
  const blobUrlRef = useRef<string | null>(null);
  const [showSvgExtractor, setShowSvgExtractor] = useState(false);
  const [showSeoManager, setShowSeoManager] = useState(false);
  const [showCodeSearch, setShowCodeSearch] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showHtmlTools, setShowHtmlTools] = useState(false);
  const [svgCount, setSvgCount] = useState(0);
  const editorRef = useRef<any>(null);
  
  // Setup context menu untuk Monaco Editor
  const setupContextMenu = (editor: any) => {
    // Tambahkan actions untuk context menu
    editor.addAction({
      id: 'ai-assistant',
      label: '🤖 AI Assistant',
      contextMenuGroupId: 'ai',
      contextMenuOrder: 1,
      run: () => {
        setShowAIAssistant(true);
      }
    });
    
    editor.addAction({
      id: 'html-tools',
      label: '🛠️ HTML Tools',
      contextMenuGroupId: 'tools',
      contextMenuOrder: 1,
      run: () => {
        setShowHtmlTools(true);
      }
    });
    
    editor.addAction({
      id: 'code-search',
      label: '🔍 Cari Kode (Ctrl+F)',
      contextMenuGroupId: 'tools',
      contextMenuOrder: 2,
      run: () => {
        setShowCodeSearch(true);
      }
    });
    
    editor.addAction({
      id: 'svg-extractor',
      label: '🖼️ Ekstrak SVG',
      contextMenuGroupId: 'tools',
      contextMenuOrder: 3,
      run: () => {
        setShowSvgExtractor(true);
      }
    });
    
    editor.addAction({
      id: 'seo-manager',
      label: '📊 SEO Manager',
      contextMenuGroupId: 'tools',
      contextMenuOrder: 4,
      run: () => {
        setShowSeoManager(true);
      }
    });
    
    editor.addAction({
      id: 'format-code',
      label: '✨ Format Kode',
      contextMenuGroupId: 'format',
      contextMenuOrder: 1,
      run: () => {
        editor.getAction('editor.action.formatDocument')?.run();
        toast.success("Kode diformat");
      }
    });
    
    editor.addAction({
      id: 'beautify-code',
      label: '💅 Beautify HTML',
      contextMenuGroupId: 'format',
      contextMenuOrder: 2,
      run: async () => {
        try {
          const { formatHtml } = await import("@/lib/editor/htmlFormatter");
          const formatted = formatHtml(htmlContent);
          setHtmlContent(formatted);
          toast.success("HTML di-beautify");
        } catch (error) {
          console.error("Error beautifying:", error);
          toast.error("Error saat beautify HTML");
        }
      }
    });
    
    editor.addAction({
      id: 'minify-code',
      label: '📦 Minify HTML',
      contextMenuGroupId: 'format',
      contextMenuOrder: 3,
      run: async () => {
        try {
          const { cleanHtml } = await import("@/lib/editor/htmlCleaner");
          const minified = cleanHtml(htmlContent);
          setHtmlContent(minified);
          toast.success("HTML di-minify");
        } catch (error) {
          console.error("Error minifying:", error);
          toast.error("Error saat minify HTML");
        }
      }
    });
    
    editor.addAction({
      id: 'copy-line',
      label: '📋 Salin Baris',
      contextMenuGroupId: 'edit',
      contextMenuOrder: 1,
      run: () => {
        const selection = editor.getSelection();
        if (selection) {
          const lineContent = editor.getModel()?.getLineContent(selection.startLineNumber) || '';
          navigator.clipboard.writeText(lineContent);
          toast.success("Baris disalin");
        }
      }
    });
    
    editor.addAction({
      id: 'duplicate-line',
      label: '📄 Duplikat Baris',
      contextMenuGroupId: 'edit',
      contextMenuOrder: 2,
      run: () => {
        editor.trigger('keyboard', 'editor.action.copyLinesDownAction', null);
        toast.success("Baris diduplikat");
      }
    });
    
    editor.addAction({
      id: 'delete-line',
      label: '🗑️ Hapus Baris',
      contextMenuGroupId: 'edit',
      contextMenuOrder: 3,
      run: () => {
        editor.trigger('keyboard', 'editor.action.deleteLines', null);
        toast.success("Baris dihapus");
      }
    });
  };

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  // Keyboard shortcut untuk search (Ctrl+F atau Cmd+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowCodeSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    // Debounce preview update to avoid too many requests
    const timeoutId = setTimeout(() => {
      if (!loading && template && htmlContent) {
        console.log(`[Preview] Updating preview (HTML length: ${htmlContent.length})`);
        updatePreview();
      }
    }, 500); // Increased debounce to 500ms for stability

    return () => clearTimeout(timeoutId);
  }, [htmlContent, template, loading]);

  // Detect SVG in HTML content
  useEffect(() => {
    if (!htmlContent) {
      setSvgCount(0);
      return;
    }

    const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
    const matches = htmlContent.match(svgRegex);
    setSvgCount(matches ? matches.length : 0);
  }, [htmlContent]);

  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/admin/templates/${templateId}?t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch template");
      }

      setTemplate(data);

      let html = "";
      if (data.style_config_json?.htmlContent) {
        html = data.style_config_json.htmlContent;
      } else if (data.ejs_file_path) {
        try {
          const htmlRes = await fetch(`/api/admin/templates/${templateId}/html`, {
            cache: "no-store",
          });
          if (htmlRes.ok) {
            const htmlData = await htmlRes.json();
            html = htmlData.htmlContent || "";
          }
        } catch (error) {
          console.error("Failed to load HTML:", error);
        }
      }

      setHtmlContent(html || "<!DOCTYPE html>\n<html>\n<head></head>\n<body>\n  <p>No content</p>\n</body>\n</html>");
    } catch (error: any) {
      console.error("Failed to fetch template:", error);
      toast.error(`Gagal memuat template: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = async () => {
    // Don't update if still loading or no content
    if (!template || !htmlContent || loading) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPreviewUrl("");
      return;
    }

    // Validate HTML content
    if (!htmlContent.trim() || htmlContent.length < 50) {
      console.warn("HTML content is too short or empty");
      setPreviewUrl("");
      return;
    }

    // Get template name untuk base href
    const normalizedName = template.name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    try {
      // Save HTML content to database first (for real-time preview)
      const saveResponse = await fetch("/api/admin/save-template-html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          htmlContent: htmlContent,
          ejsFilePath: template.ejs_file_path,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "Failed to save HTML for preview");
      }

      console.log(`[Preview] HTML saved, now generating preview URL`);

      // Use preview API which reads from database (most up-to-date)
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const previewApiUrl = `/api/admin/preview-template?templateId=${encodeURIComponent(normalizedName)}&t=${timestamp}`;
      
      // Force iframe reload by changing URL
      setPreviewUrl(""); // Clear first to force reload
      
      // Small delay to ensure state update
      setTimeout(() => {
        setPreviewUrl(previewApiUrl);
        console.log(`[Preview] Preview URL set: ${previewApiUrl}`);
      }, 100);
      
      // Clean up blob URL if exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    } catch (error: any) {
      console.error("[Preview] Error generating preview:", error);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPreviewUrl("");
      // Don't show toast on every error to avoid spam
      // toast.error("Gagal memuat preview. Periksa console untuk detail.");
    }
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!template) return;

    setSaving(true);
    try {
      let finalHtmlContent = htmlContent;

      // Auto-extract all SVGs if any exist (MASS EXTRACTION)
      if (svgCount > 0) {
        toast.loading(`Mengekstrak ${svgCount} SVG secara massal...`, { id: "extracting-svg" });
        
        try {
          console.log(`[Save] Starting mass SVG extraction for ${svgCount} SVGs`);
          
          const extractRes = await fetch("/api/admin/extract-all-svgs", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              templateId: template.id,
              htmlContent: htmlContent,
            }),
          });

          const extractData = await extractRes.json();

          if (!extractRes.ok) {
            throw new Error(extractData.error || "Gagal mengekstrak SVG");
          }

          console.log(`[Save] Extraction result:`, extractData);

          if (extractData.extractedCount > 0) {
            // Update HTML content with replaced SVGs
            finalHtmlContent = extractData.htmlContent;
            
            // CRITICAL: Update editor content immediately - force update
            setHtmlContent(finalHtmlContent);
            
            console.log(`[Save] Updated HTML content, ${extractData.extractedCount} SVGs replaced`);
            console.log(`[Save] Original SVG count: ${extractData.originalSvgCount || svgCount}`);
            console.log(`[Save] Extracted count: ${extractData.extractedCount}`);
            
            // Verify no SVGs remain in the updated content
            const remainingSvgRegex = /<svg[\s\S]*?<\/svg>/gi;
            const remainingSvgs = finalHtmlContent.match(remainingSvgRegex);
            if (remainingSvgs && remainingSvgs.length > 0) {
              console.warn(`[Save] WARNING: ${remainingSvgs.length} SVG masih tersisa di HTML setelah ekstraksi!`);
            } else {
              console.log(`[Save] ✓ Semua SVG berhasil diganti`);
            }
            
            toast.success(
              `${extractData.extractedCount} SVG berhasil diekstrak dan diganti!`,
              { id: "extracting-svg", duration: 3000 }
            );
            
            // Update SVG count after extraction
            setSvgCount(0);
            
            // Small delay to ensure state update
            await new Promise(resolve => setTimeout(resolve, 150));
          } else {
            toast.dismiss("extracting-svg");
            console.log(`[Save] No SVGs extracted (count: ${extractData.extractedCount})`);
          }
        } catch (extractError: any) {
          console.error("[Save] SVG extraction error:", extractError);
          toast.error(`Error ekstraksi SVG: ${extractError.message}`, { id: "extracting-svg" });
          // Continue with save even if extraction fails
        }
      }

      // Save the HTML content (with SVGs replaced if extraction was successful)
      console.log(`[Save] Saving HTML content (length: ${finalHtmlContent.length})`);
      
      const res = await fetch("/api/admin/save-template-html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          htmlContent: finalHtmlContent,
          ejsFilePath: template.ejs_file_path,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      // Verify final HTML has no remaining SVGs
      const finalSvgCheck = finalHtmlContent.match(/<svg[\s\S]*?<\/svg>/gi);
      if (finalSvgCheck && finalSvgCheck.length > 0) {
        console.warn(`[Save] WARNING: Masih ada ${finalSvgCheck.length} SVG di HTML setelah save!`);
        toast.error(`Peringatan: ${finalSvgCheck.length} SVG masih tersisa`, { duration: 4000 });
      } else {
        console.log(`[Save] ✓ Semua SVG berhasil diekstrak dan HTML disimpan`);
      }

      toast.success("Template berhasil disimpan!");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSvgExtracted = (originalSvg: string, replacement: string) => {
    // Replace first occurrence of the SVG with the image tag
    const newContent = htmlContent.replace(originalSvg, replacement);
    setHtmlContent(newContent);
    toast.success("SVG telah diganti dengan referensi file!");
  };

  const handleMassExtract = (updatedHtml: string) => {
    // Update HTML content after mass extraction
    setHtmlContent(updatedHtml);
    
    // Update SVG count
    const svgRegex = /<svg[\s\S]*?<\/svg>/gi;
    const matches = updatedHtml.match(svgRegex);
    setSvgCount(matches ? matches.length : 0);
    
    console.log(`[Mass Extract] HTML content updated, ${matches ? matches.length : 0} SVGs remaining`);
  };

  if (loading && !template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-600">Template tidak ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-700 rounded transition text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {template.name}
            </h1>
            <p className="text-xs text-gray-400">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HistoryManager htmlContent={htmlContent} onContentChange={setHtmlContent} />
          <button
            onClick={() => setShowAIAssistant(true)}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 text-sm"
            title="AI Assistant (Client-side)"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI</span>
          </button>
          <HtmlTools htmlContent={htmlContent} onHtmlChange={setHtmlContent} />
          <button
            onClick={() => setShowSeoManager(true)}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm"
            title="Manage SEO Meta Tags"
          >
            <Search className="w-4 h-4" />
            <span>SEO</span>
          </button>
          {svgCount > 0 && (
            <button
              onClick={() => setShowSvgExtractor(true)}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
              title={`${svgCount} SVG ditemukan di HTML`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>SVG ({svgCount})</span>
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Monaco Editor */}
        <ResizablePanel
          direction="horizontal"
          initialSize={editorSize}
          minSize={40}
          maxSize={85}
          onResize={setEditorSize}
        >
          <div className="flex flex-col h-full border-r border-gray-700">
            <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">HTML Editor</span>
              </div>
              <button
                onClick={() => setShowCodeSearch(true)}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-2 transition"
                title="Cari kode (Ctrl+F)"
              >
                <Search className="w-4 h-4" />
                <span>Cari</span>
              </button>
            </div>
            <div className="flex-1 relative">
              {showCodeSearch && (
                <CodeSearch
                  htmlContent={htmlContent}
                  onNavigateToLine={(line, column) => {
                    if (editorRef.current) {
                      const editor = editorRef.current;
                      editor.revealLineInCenter(line);
                      editor.setPosition({ lineNumber: line, column });
                      editor.focus();
                    }
                  }}
                  onClose={() => setShowCodeSearch(false)}
                />
              )}
              <Editor
                height="100%"
                defaultLanguage="html"
                value={htmlContent}
                onChange={(value) => setHtmlContent(value || "")}
                onMount={(editor) => {
                  editorRef.current = editor;
                  
                  // Tambahkan context menu (klik kanan)
                  setupContextMenu(editor);
                }}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  wordWrap: "on",
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  formatOnPaste: false, // Disabled to prevent unwanted auto-formatting
                  formatOnType: false, // Disabled to prevent unwanted auto-formatting
                  formatOnSave: false, // Disabled to prevent unwanted auto-formatting
                  insertSpaces: true,
                  detectIndentation: false, // Prevent auto-detection that might cause issues
                  trimAutoWhitespace: false, // Prevent auto-trimming that might break formatting
                  contextmenu: true, // Enable context menu
                }}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col bg-gray-900">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Mobile Preview</span>
          </div>
          <div className="flex-1 bg-gray-900 flex items-center justify-center p-4 overflow-auto">
            <div className="bg-white shadow-2xl rounded-lg overflow-hidden" style={{ width: "375px", maxWidth: "100%", height: "667px", maxHeight: "100%" }}>
              {previewUrl ? (
                <iframe
                  key={previewUrl} // Force reload when URL changes
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="Template Preview"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                  style={{ width: "100%", height: "100%", display: "block" }}
                  onLoad={(e) => {
                    console.log(`[Preview] Iframe loaded: ${previewUrl}`);
                    // Capture console errors from iframe
                    try {
                      const iframe = e.target as HTMLIFrameElement;
                      const iframeWindow = iframe.contentWindow;
                      if (iframeWindow) {
                        const originalError = iframeWindow.console.error;
                        const originalWarn = iframeWindow.console.warn;
                        
                        iframeWindow.console.error = (...args: any[]) => {
                          originalError.apply(iframeWindow.console, args);
                          console.error('[Preview Error]', ...args);
                        };
                        
                        iframeWindow.console.warn = (...args: any[]) => {
                          originalWarn.apply(iframeWindow.console, args);
                          console.warn('[Preview Warning]', ...args);
                        };
                      }
                    } catch (err) {
                      // Cross-origin restrictions may prevent access
                      console.log('Cannot access iframe console (cross-origin)');
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-500">
                  Loading preview...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SVG Extractor Modal */}
      {showSvgExtractor && template && (
        <SvgExtractor
          htmlContent={htmlContent}
          templateId={template.id}
          templateName={template.name}
          onSvgExtracted={handleSvgExtracted}
          onMassExtract={handleMassExtract}
          onClose={() => setShowSvgExtractor(false)}
        />
      )}

      {/* SEO Manager Modal */}
      {showSeoManager && template && (
        <SeoManager
          templateId={template.id}
          htmlContent={htmlContent}
          onClose={() => setShowSeoManager(false)}
        />
      )}

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <AIAssistant
          htmlContent={htmlContent}
          onInsertCode={(code) => {
            if (editorRef.current) {
              const editor = editorRef.current;
              const position = editor.getPosition();
              const model = editor.getModel();
              if (model) {
                // Insert code at current cursor position
                const edit = {
                  range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                  },
                  text: code,
                };
                model.pushEditOperations([], [edit], () => null);
                editor.focus();
              }
            }
          }}
          onReplaceCode={(code) => {
            setHtmlContent(code);
          }}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

      {/* HTML Tools Modal */}
      {showHtmlTools && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">HTML Tools</h2>
              <button
                onClick={() => setShowHtmlTools(false)}
                className="p-2 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <HtmlTools htmlContent={htmlContent} onHtmlChange={setHtmlContent} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
