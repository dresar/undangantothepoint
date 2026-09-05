"use client";

import { useState } from "react";
import { 
  Code2, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  Search, 
  FileCode,
  Minimize2,
  Settings,
  Zap,
  Eye,
  AlertTriangle
} from "lucide-react";
import { HtmlToolsModal } from "./HtmlToolsModal";

interface HtmlToolsProps {
  htmlContent: string;
  onHtmlChange: (newHtml: string) => void;
}

export function HtmlTools({ htmlContent, onHtmlChange }: HtmlToolsProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowModal(true)}
          className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 text-sm"
          title="HTML Tools - Format, Clean, Validate"
        >
          <Code2 className="w-4 h-4" />
          <span>HTML Tools</span>
        </button>
      </div>

      {showModal && (
        <HtmlToolsModal
          htmlContent={htmlContent}
          onHtmlChange={onHtmlChange}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

