"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ChevronUp, ChevronDown, FileText } from "lucide-react";

interface SearchResult {
  line: number;
  column: number;
  match: string;
  context: string;
}

interface CodeSearchProps {
  htmlContent: string;
  onNavigateToLine: (line: number, column: number) => void;
  onClose: () => void;
}

export function CodeSearch({ htmlContent, onNavigateToLine, onClose }: CodeSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lines = htmlContent.split("\n");

    try {
      let regex: RegExp;
      if (useRegex) {
        regex = new RegExp(searchQuery, caseSensitive ? "g" : "gi");
      } else {
        // Escape special regex characters
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(escapedQuery, caseSensitive ? "g" : "gi");
      }

      lines.forEach((line, lineIndex) => {
        const lineNumber = lineIndex + 1;
        let match;
        const lineCopy = line;

        while ((match = regex.exec(lineCopy)) !== null) {
          const column = match.index + 1;
          const matchText = match[0];
          
          // Get context (50 chars before and after)
          const start = Math.max(0, match.index - 50);
          const end = Math.min(line.length, match.index + matchText.length + 50);
          const context = line.substring(start, end);
          
          searchResults.push({
            line: lineNumber,
            column,
            match: matchText,
            context: context.trim(),
          });

          // Prevent infinite loop
          if (!regex.global) break;
        }
      });
    } catch (error) {
      // Invalid regex, ignore
      setResults([]);
      return;
    }

    setResults(searchResults);
    setSelectedIndex(0);
  }, [searchQuery, htmlContent, caseSensitive, useRegex]);

  useEffect(() => {
    // Scroll selected result into view
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const handleNavigate = (result: SearchResult) => {
    onNavigateToLine(result.line, result.column);
  };

  const handleNext = () => {
    if (results.length === 0) return;
    const nextIndex = (selectedIndex + 1) % results.length;
    setSelectedIndex(nextIndex);
    handleNavigate(results[nextIndex]);
  };

  const handlePrevious = () => {
    if (results.length === 0) return;
    const prevIndex = (selectedIndex - 1 + results.length) % results.length;
    setSelectedIndex(prevIndex);
    handleNavigate(results[prevIndex]);
  };

  const highlightMatch = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    try {
      let regex: RegExp;
      if (useRegex) {
        regex = new RegExp(`(${query})`, caseSensitive ? "g" : "gi");
      } else {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        regex = new RegExp(`(${escapedQuery})`, caseSensitive ? "gi" : "gi");
      }
      
      return text.replace(regex, '<mark class="bg-yellow-400 text-yellow-900 px-1 rounded">$1</mark>');
    } catch {
      return text;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    } else if (e.key === "ArrowDown" && e.ctrlKey) {
      e.preventDefault();
      handleNext();
    } else if (e.key === "ArrowUp" && e.ctrlKey) {
      e.preventDefault();
      handlePrevious();
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 z-50 shadow-lg">
      <div className="p-3">
        {/* Search Input */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari kode... (Ctrl+F untuk navigasi, Esc untuk tutup)"
              className="w-full pl-10 pr-4 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Options */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="w-3 h-3"
            />
            <span>Case Sensitive</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={useRegex}
              onChange={(e) => setUseRegex(e.target.checked)}
              className="w-3 h-3"
            />
            <span>Regex</span>
          </label>
          {results.length > 0 && (
            <span className="text-blue-400">
              {selectedIndex + 1} / {results.length} hasil
            </span>
          )}
        </div>

        {/* Navigation Buttons */}
        {results.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handlePrevious}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-1 transition"
              title="Previous (Shift+Enter)"
            >
              <ChevronUp className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={handleNext}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm flex items-center gap-1 transition"
              title="Next (Enter)"
            >
              <ChevronDown className="w-4 h-4" />
              Next
            </button>
          </div>
        )}

        {/* Results List */}
        {searchQuery && (
          <div
            ref={resultsRef}
            className="max-h-64 overflow-y-auto bg-gray-900 rounded-lg border border-gray-700"
          >
            {results.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                Tidak ada hasil ditemukan
              </div>
            ) : (
              results.map((result, index) => (
                <button
                  key={`${result.line}-${result.column}-${index}`}
                  onClick={() => {
                    setSelectedIndex(index);
                    handleNavigate(result);
                  }}
                  className={`w-full text-left p-3 border-b border-gray-700 hover:bg-gray-800 transition ${
                    index === selectedIndex ? "bg-blue-900 bg-opacity-30 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 text-blue-400 font-mono text-xs min-w-[80px]">
                      <FileText className="w-3 h-3" />
                      <span>Baris {result.line}</span>
                    </div>
                    <div className="flex-1 font-mono text-xs text-gray-300">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: highlightMatch(result.context, searchQuery),
                        }}
                      />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

