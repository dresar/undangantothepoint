"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { History, RotateCcw, Undo2, Redo2, Clock, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface HistoryEntry {
  content: string;
  timestamp: number;
  description?: string;
}

interface HistoryManagerProps {
  htmlContent: string;
  onContentChange: (content: string) => void;
}

export function HistoryManager({ htmlContent, onContentChange }: HistoryManagerProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);
  const initialContentRef = useRef<string>("");
  const isRestoringRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize history dengan content awal
  useEffect(() => {
    if (initialContentRef.current === "" && htmlContent) {
      initialContentRef.current = htmlContent;
      const initialEntry: HistoryEntry = {
        content: htmlContent,
        timestamp: Date.now(),
        description: "Versi Awal"
      };
      setHistory([initialEntry]);
      setCurrentIndex(0);
    }
  }, []);

  // Simpan perubahan ke history (debounced)
  useEffect(() => {
    // Skip jika sedang restore dari history
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    // Skip jika belum ada initial content
    if (initialContentRef.current === "") {
      return;
    }

    // Debounce untuk menghindari terlalu banyak history entry
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Cek apakah content benar-benar berubah
      const lastEntry = history[currentIndex];
      if (lastEntry && lastEntry.content === htmlContent) {
        return; // Tidak ada perubahan
      }

      // Hapus history setelah currentIndex (jika ada)
      const newHistory = history.slice(0, currentIndex + 1);
      
      // Tambahkan entry baru
      const newEntry: HistoryEntry = {
        content: htmlContent,
        timestamp: Date.now(),
        description: "Perubahan"
      };
      
      // Limit history to 50 entries
      const updatedHistory = [...newHistory, newEntry].slice(-50);
      
      setHistory(updatedHistory);
      setCurrentIndex(updatedHistory.length - 1);
    }, 1000); // Debounce 1 detik

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [htmlContent]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (currentIndex <= 0) return;
    
    const prevIndex = currentIndex - 1;
    const prevEntry = history[prevIndex];
    
    if (prevEntry) {
      isRestoringRef.current = true;
      setCurrentIndex(prevIndex);
      onContentChange(prevEntry.content);
      toast.success("Undo: Kembali ke versi sebelumnya");
    }
  }, [currentIndex, history, onContentChange]);

  const handleRedo = useCallback(() => {
    if (currentIndex >= history.length - 1) return;
    
    const nextIndex = currentIndex + 1;
    const nextEntry = history[nextIndex];
    
    if (nextEntry) {
      isRestoringRef.current = true;
      setCurrentIndex(nextIndex);
      onContentChange(nextEntry.content);
      toast.success("Redo: Kembali ke versi berikutnya");
    }
  }, [currentIndex, history, onContentChange]);

  // Keyboard shortcuts untuk undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo (Ctrl+Z atau Cmd+Z)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo (Ctrl+Y atau Cmd+Y, atau Ctrl+Shift+Z)
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleReset = () => {
    if (!initialContentRef.current) return;
    
    if (confirm("Apakah Anda yakin ingin reset semua perubahan ke versi awal?")) {
      isRestoringRef.current = true;
      setCurrentIndex(0);
      onContentChange(initialContentRef.current);
      toast.success("Reset: Kembali ke versi awal");
    }
  };

  const handleRestoreVersion = (index: number) => {
    const entry = history[index];
    if (entry) {
      isRestoringRef.current = true;
      setCurrentIndex(index);
      onContentChange(entry.content);
      setShowHistory(false);
      toast.success("Versi dipulihkan");
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition"
          title="Reset ke Versi Awal"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition flex items-center gap-1"
          title="Riwayat Perubahan"
        >
          <History className="w-4 h-4" />
          <span className="text-xs">{history.length}</span>
        </button>
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Riwayat Perubahan</h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-2 hover:bg-gray-700 rounded transition text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {history.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <p>Belum ada riwayat perubahan</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((entry, index) => (
                    <div
                      key={index}
                      onClick={() => handleRestoreVersion(index)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        index === currentIndex
                          ? "bg-blue-900 border-blue-600"
                          : "bg-gray-700 border-gray-600 hover:bg-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {index === currentIndex && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          )}
                          <span className="text-sm font-medium text-white">
                            {entry.description || `Versi ${index + 1}`}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {entry.content.length} karakter
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Total: {history.length} versi
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

