"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle2, Info, XCircle, Wrench } from "lucide-react";
import { validateHtml, repairHtml } from "@/lib/editor";
import { toast } from "react-hot-toast";

interface ErrorModalProps {
  htmlContent: string;
  onClose: () => void;
  onRepaired?: (repairedHtml: string) => void;
}

export function ErrorModal({ htmlContent, onClose, onRepaired }: ErrorModalProps) {
  const [repairedHtml, setRepairedHtml] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  
  const currentHtml = repairedHtml || htmlContent;
  const issues = validateHtml(currentHtml);
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');

  const handleRepair = () => {
    setIsRepairing(true);
    console.log('=== MULAI PROSES PERBAIKAN HTML ===');
    console.log('[ErrorModal] HTML awal panjang:', htmlContent.length);
    console.log('[ErrorModal] HTML awal (1000 karakter pertama):', htmlContent.substring(0, 1000));
    
    // Validasi sebelum perbaikan
    const beforeIssues = validateHtml(htmlContent);
    const beforeErrors = beforeIssues.filter(i => i.type === 'error');
    const beforeWarnings = beforeIssues.filter(i => i.type === 'warning');
    
    console.log('[ErrorModal] Error sebelum perbaikan:', beforeErrors.length);
    console.log('[ErrorModal] Warnings sebelum perbaikan:', beforeWarnings.length);
    console.log('[ErrorModal] Detail error sebelum:', beforeErrors);
    console.log('[ErrorModal] Detail warnings sebelum:', beforeWarnings);
    
    try {
      let repaired = htmlContent;
      let repairAttempts = 0;
      const maxAttempts = 3;
      
      // Loop perbaikan sampai error berkurang atau maksimal 3 kali
      while (repairAttempts < maxAttempts) {
        repairAttempts++;
        console.log(`[ErrorModal] === PERBAIKAN PERCOBAAN ${repairAttempts}/${maxAttempts} ===`);
        
        // Perbaiki dengan DOMParser (lebih akurat)
        console.log('[ErrorModal] Memulai perbaikan dengan DOMParser...');
        const repairedAttempt = repairHtml(repaired, {
          fixUnclosedTags: true,
          fixNestedTags: false,
          fixQuotes: true,
          fixAttributes: false,
          removeInvalidTags: false,
          useDOMParser: true, // Gunakan DOMParser
          debug: true,
        });
        
        console.log('[ErrorModal] HTML setelah perbaikan panjang:', repairedAttempt.length);
        console.log('[ErrorModal] HTML berubah:', repairedAttempt !== repaired);
        console.log('[ErrorModal] Perbedaan karakter:', repairedAttempt.length - repaired.length);
        
        // Validasi setelah perbaikan
        const afterIssues = validateHtml(repairedAttempt);
        const afterErrors = afterIssues.filter(i => i.type === 'error');
        
        console.log('[ErrorModal] Error setelah perbaikan:', afterErrors.length);
        
        // Jika error berkurang atau tidak berubah tapi HTML berubah, gunakan hasil ini
        if (afterErrors.length < beforeErrors.length || (repairedAttempt !== repaired && afterErrors.length <= beforeErrors.length)) {
          repaired = repairedAttempt;
          console.log('[ErrorModal] ✓ Perbaikan berhasil pada percobaan', repairAttempts);
          break;
        } else if (repairedAttempt === repaired) {
          console.log('[ErrorModal] ⚠ HTML tidak berubah pada percobaan', repairAttempts);
          // Jika tidak ada perubahan dan masih ada error, coba perbaikan manual
          if (afterErrors.length > 0 && repairAttempts === 1) {
            console.log('[ErrorModal] Mencoba perbaikan manual untuk error spesifik...');
            repaired = repairSpecificErrors(repaired, beforeErrors, true);
          } else {
            break; // Tidak ada yang bisa diperbaiki
          }
        } else {
          repaired = repairedAttempt; // Gunakan hasil meskipun error tidak berkurang
        }
      }
      
      console.log('[ErrorModal] HTML final panjang:', repaired.length);
      console.log('[ErrorModal] HTML final (1000 karakter pertama):', repaired.substring(0, 1000));
      console.log('[ErrorModal] Total perubahan karakter:', repaired.length - htmlContent.length);
      
      setRepairedHtml(repaired);
      
      // Validasi final
      const finalIssues = validateHtml(repaired);
      const finalErrors = finalIssues.filter(i => i.type === 'error');
      const finalWarnings = finalIssues.filter(i => i.type === 'warning');
      
      console.log('[ErrorModal] Error final:', finalErrors.length);
      console.log('[ErrorModal] Warnings final:', finalWarnings.length);
      console.log('[ErrorModal] Detail error final:', finalErrors);
      
      // Bandingkan error secara detail
      const errorDiff = beforeErrors.length - finalErrors.length;
      console.log('[ErrorModal] Perubahan error:', errorDiff > 0 ? `-${errorDiff}` : errorDiff < 0 ? `+${Math.abs(errorDiff)}` : '0');
      
      // Cari error yang hilang
      const fixedErrors = beforeErrors.filter(be => 
        !finalErrors.some(ae => ae.message === be.message && ae.line === be.line)
      );
      console.log('[ErrorModal] Error yang diperbaiki:', fixedErrors.length, fixedErrors);
      
      // Cari error baru
      const newErrors = finalErrors.filter(ae => 
        !beforeErrors.some(be => be.message === ae.message && be.line === ae.line)
      );
      console.log('[ErrorModal] Error baru yang muncul:', newErrors.length, newErrors);
      
      if (finalErrors.length < beforeErrors.length) {
        toast.success(`HTML berhasil diperbaiki! Error berkurang dari ${beforeErrors.length} menjadi ${finalErrors.length}`);
        console.log('[ErrorModal] ✓ Perbaikan berhasil!');
      } else if (finalErrors.length > beforeErrors.length) {
        toast.error(`Perbaikan menambah error! Dari ${beforeErrors.length} menjadi ${finalErrors.length}. Cek console untuk detail.`);
        console.error('[ErrorModal] ✗ Perbaikan menambah error!');
      } else if (repaired !== htmlContent) {
        toast.success(`HTML telah diperbaiki. Struktur HTML diperbaiki meskipun jumlah error tetap ${finalErrors.length}.`);
        console.log('[ErrorModal] ⚠ Jumlah error tidak berubah tapi HTML sudah diperbaiki');
      } else {
        toast.info(`Tidak ada perubahan yang diperlukan. HTML sudah valid atau tidak dapat diperbaiki secara otomatis.`);
        console.log('[ErrorModal] ⚠ Tidak ada perubahan');
      }
      
      console.log('=== SELESAI PROSES PERBAIKAN HTML ===');
    } catch (error: any) {
      console.error('[ErrorModal] Error saat memperbaiki:', error);
      console.error('[ErrorModal] Stack trace:', error.stack);
      toast.error(`Error saat memperbaiki: ${error.message}. Cek console untuk detail.`);
    } finally {
      setIsRepairing(false);
    }
  };

  // Fungsi untuk memperbaiki error spesifik
  const repairSpecificErrors = (html: string, errors: any[], debug: boolean = false): string => {
    let repaired = html;
    const log = (msg: string) => {
      if (debug) console.log('[ErrorModal Repair Specific]', msg);
    };
    
    log('Memperbaiki error spesifik...');
    
    errors.forEach((error, idx) => {
      log(`Error ${idx + 1}: ${error.message} (Baris: ${error.line})`);
      
      // Perbaiki tag yang tidak tertutup
      if (error.message.includes('tidak ditutup')) {
        const tagMatch = error.message.match(/Tag <(\w+)>/);
        if (tagMatch) {
          const tagName = tagMatch[1];
          log(`  Menutup tag: </${tagName}>`);
          // Tambahkan closing tag di akhir
          repaired += `</${tagName}>`;
        }
      }
      
      // Perbaiki tag penutup yang tidak cocok
      if (error.message.includes('Tag penutup tidak cocok')) {
        log(`  Error tag mismatch - perlu perbaikan manual`);
      }
    });
    
    return repaired;
  };

  const handleApplyRepair = () => {
    if (repairedHtml && onRepaired) {
      onRepaired(repairedHtml);
      toast.success("Perbaikan diterapkan ke editor!");
      onClose();
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-xl font-semibold">Validasi HTML</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Stats */}
          <div className="p-4 border-b">
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
          </div>

          {/* Issues List */}
          <div className="flex-1 overflow-auto p-4">
            {issues.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-semibold">HTML Valid!</p>
                <p className="text-green-600 text-sm">Tidak ada masalah ditemukan</p>
              </div>
            ) : (
              <div className="space-y-2">
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
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t bg-gray-50">
          <div>
            {errors.length > 0 && !repairedHtml && (
              <button
                onClick={handleRepair}
                disabled={isRepairing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                {isRepairing ? "Memperbaiki..." : "Perbaiki Otomatis"}
              </button>
            )}
            {repairedHtml && (
              <div className="text-sm text-green-600 font-medium">
                ✓ HTML telah diperbaiki
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {repairedHtml && onRepaired && (
              <button
                onClick={handleApplyRepair}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Terapkan Perbaikan
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

