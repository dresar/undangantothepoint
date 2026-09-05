"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Code, Lightbulb, Wand2, AlertCircle, Brain } from "lucide-react";
import { toast } from "react-hot-toast";

interface AIAssistantProps {
  htmlContent: string;
  onInsertCode: (code: string) => void;
  onReplaceCode: (code: string) => void;
  onClose: () => void;
}

type AIMode = "generate" | "explain" | "fix" | "optimize" | "suggest";
type AIProvider = "gemini" | "groq";

export function AIAssistant({ htmlContent, onInsertCode, onReplaceCode, onClose }: AIAssistantProps) {
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AIMode>("generate");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load API keys from localStorage
    const savedGeminiKey = localStorage.getItem("gemini_api_key");
    const savedGroqKey = localStorage.getItem("groq_api_key");
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
    }
    if (savedGroqKey) {
      setGroqApiKey(savedGroqKey);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll response
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const saveApiKey = () => {
    if (provider === "gemini") {
      if (geminiApiKey.trim()) {
        localStorage.setItem("gemini_api_key", geminiApiKey);
        toast.success("Gemini API key disimpan");
      } else {
        toast.error("Gemini API key tidak boleh kosong");
      }
    } else {
      if (groqApiKey.trim()) {
        localStorage.setItem("groq_api_key", groqApiKey);
        toast.success("Groq API key disimpan");
      } else {
        toast.error("Groq API key tidak boleh kosong");
      }
    }
  };

  const getCurrentApiKey = (): string => {
    return provider === "gemini" ? geminiApiKey : groqApiKey;
  };

  const getSystemPrompt = (mode: AIMode): string => {
    switch (mode) {
      case "generate":
        return "Kamu adalah asisten AI yang ahli dalam HTML. Generate kode HTML yang valid, bersih, dan modern berdasarkan permintaan user. Hanya kembalikan kode HTML tanpa penjelasan tambahan kecuali diminta.";
      case "explain":
        return "Kamu adalah asisten AI yang ahli dalam HTML. Jelaskan kode HTML yang diberikan dengan jelas dan mudah dipahami dalam bahasa Indonesia.";
      case "fix":
        return "Kamu adalah asisten AI yang ahli dalam HTML. Perbaiki kode HTML yang diberikan, perbaiki error, tutup tag yang tidak tertutup, dan pastikan kode valid. Hanya kembalikan kode HTML yang sudah diperbaiki tanpa penjelasan.";
      case "optimize":
        return "Kamu adalah asisten AI yang ahli dalam HTML. Optimalkan kode HTML yang diberikan untuk performa, aksesibilitas, dan SEO. Hanya kembalikan kode HTML yang sudah dioptimalkan tanpa penjelasan.";
      case "suggest":
        return "Kamu adalah asisten AI yang ahli dalam HTML. Berikan saran perbaikan untuk kode HTML yang diberikan. Jelaskan masalah dan solusinya dalam bahasa Indonesia.";
      default:
        return "Kamu adalah asisten AI yang ahli dalam HTML.";
    }
  };

  const getModePrompt = (mode: AIMode, userPrompt: string): string => {
    switch (mode) {
      case "generate":
        return `Generate kode HTML untuk: ${userPrompt}`;
      case "explain":
        return `Jelaskan kode HTML berikut dengan detail:\n\n${htmlContent}\n\nJelaskan struktur, fungsi setiap bagian, dan bagaimana kode ini bekerja.`;
      case "fix":
        return `Perbaiki kode HTML berikut. Perbaiki semua error, tutup tag yang tidak tertutup, dan pastikan kode valid:\n\n${htmlContent}\n\nHanya kembalikan kode HTML yang sudah diperbaiki tanpa penjelasan tambahan.`;
      case "optimize":
        return `Optimalkan kode HTML berikut untuk performa, aksesibilitas, dan SEO:\n\n${htmlContent}\n\nHanya kembalikan kode HTML yang sudah dioptimalkan tanpa penjelasan tambahan.`;
      case "suggest":
        return `Berikan saran perbaikan untuk kode HTML berikut:\n\n${htmlContent}\n\nJelaskan masalah yang ditemukan dan berikan saran perbaikan dalam bahasa Indonesia.`;
      default:
        return userPrompt;
    }
  };

  const callGeminiAPI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    const apiKey = getCurrentApiKey();
    
    // Gemini API menggunakan Google Generative AI
    // Gabungkan system prompt dan user prompt
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    // Gunakan Gemini 2.5 Pro (atau fallback ke 1.5 Pro jika 2.5 tidak tersedia)
    const modelName = "gemini-2.5-pro";
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000, // Gemini 2.5 Pro mendukung lebih banyak tokens
            topP: 0.95,
            topK: 40,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error("Gemini API Error:", errorData);
      
      // Jika model tidak ditemukan, coba fallback ke gemini-1.5-pro
      if (response.status === 404 || errorMessage.includes("not found")) {
        console.log("Gemini 2.5 Pro tidak tersedia, mencoba Gemini 1.5 Pro...");
        return await callGeminiAPIFallback(apiKey, systemPrompt, userPrompt);
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    // Cek apakah ada error dalam response
    if (data.error) {
      throw new Error(data.error.message || "Error dari Gemini API");
    }
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons dari AI";
    
    // Cek apakah response diblokir
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      throw new Error("Respons diblokir oleh filter keamanan Gemini");
    }
    
    return aiResponse;
  };

  // Fallback ke Gemini 1.5 Pro jika 2.5 Pro tidak tersedia
  const callGeminiAPIFallback = async (apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> => {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const fallbackModel = "gemini-1.5-pro";
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
            topP: 0.95,
            topK: 40,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Error dari Gemini API");
    }
    
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada respons dari AI";
    
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      throw new Error("Respons diblokir oleh filter keamanan Gemini");
    }
    
    return aiResponse;
  };

  const callGroqAPI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
    const apiKey = getCurrentApiKey();
    
    // Model Groq yang didukung (prioritas: llama-3.3-70b-versatile sebagai pengganti llama-3.1-70b-versatile)
    // llama-3.1-70b-versatile telah dihentikan sejak 24 Januari 2025
    const models = [
      "llama-3.3-70b-versatile", // Recommended replacement untuk llama-3.1-70b-versatile
      "llama-3.1-8b-instant",     // Model cepat untuk tugas sederhana
      "mixtral-8x7b-32768",       // Model alternatif
    ];
    
    let lastError: Error | null = null;
    
    // Coba setiap model sampai berhasil
    for (const model of models) {
      try {
        console.log(`Mencoba menggunakan model Groq: ${model}`);
        
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 8000, // Increase untuk HTML yang panjang
            temperature: 0.7,
            top_p: 0.95,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
          
          // Jika model tidak ditemukan atau deprecated, coba model berikutnya
          if (response.status === 404 || 
              errorMessage.includes("not found") || 
              errorMessage.includes("decommissioned") ||
              errorMessage.includes("deprecated")) {
            console.log(`Model ${model} tidak tersedia: ${errorMessage}`);
            lastError = new Error(errorMessage);
            continue; // Coba model berikutnya
          }
          
          // Error lain, throw langsung
          console.error("Groq API Error:", errorData);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        // Cek apakah ada error dalam response
        if (data.error) {
          throw new Error(data.error.message || "Error dari Groq API");
        }
        
        const aiResponse = data.choices[0]?.message?.content || "Tidak ada respons dari AI";
        
        // Berhasil, return response
        console.log(`✓ Berhasil menggunakan model Groq: ${model}`);
        return aiResponse;
      } catch (err: any) {
        // Jika error karena model tidak tersedia, coba model berikutnya
        if (err.message?.includes("not found") || 
            err.message?.includes("decommissioned") ||
            err.message?.includes("deprecated")) {
          console.log(`Model ${model} tidak tersedia: ${err.message}`);
          lastError = err;
          continue;
        }
        // Error lain, throw langsung
        throw err;
      }
    }
    
    // Semua model gagal
    throw lastError || new Error("Semua model Groq tidak tersedia. Cek dokumentasi: https://console.groq.com/docs/models");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const apiKey = getCurrentApiKey();
    if (!apiKey.trim()) {
      setError(`${provider === "gemini" ? "Gemini" : "Groq"} API key belum diisi`);
      return;
    }

    if (!prompt.trim() && mode !== "explain" && mode !== "fix" && mode !== "optimize" && mode !== "suggest") {
      setError("Prompt belum diisi");
      return;
    }

    setLoading(true);
    setError("");
    setResponse("");

    try {
      const systemPrompt = getSystemPrompt(mode);
      const userPrompt = getModePrompt(mode, prompt);

      let aiResponse: string;
      
      if (provider === "gemini") {
        aiResponse = await callGeminiAPI(systemPrompt, userPrompt);
      } else {
        aiResponse = await callGroqAPI(systemPrompt, userPrompt);
      }

      setResponse(aiResponse);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memanggil AI");
      console.error("AI Error:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const extractCodeFromResponse = (text: string): string => {
    // Extract code from markdown code blocks (prioritas pertama)
    const codeBlockRegex = /```(?:html|HTML)?\s*([\s\S]*?)```/g;
    const matches = [...text.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      // Ambil yang pertama, atau yang terpanjang jika ada beberapa
      const longestMatch = matches.reduce((prev, curr) => 
        curr[1].length > prev[1].length ? curr : prev
      );
      return longestMatch[1].trim();
    }
    
    // Jika tidak ada code block, cari HTML lengkap (dari <!DOCTYPE atau <html sampai </html>)
    const fullHtmlRegex = /(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i;
    const fullHtmlMatch = text.match(fullHtmlRegex);
    if (fullHtmlMatch) {
      return fullHtmlMatch[1].trim();
    }
    
    // Jika tidak ada HTML lengkap, cari fragment HTML (dari tag pertama sampai tag terakhir)
    const htmlTagRegex = /<[^>]+>[\s\S]*?<\/[^>]+>/;
    const htmlMatch = text.match(htmlTagRegex);
    if (htmlMatch) {
      return htmlMatch[0].trim();
    }
    
    // Jika tidak ada HTML, kembalikan teks asli (mungkin penjelasan)
    return text.trim();
  };

  const handleInsert = () => {
    if (response) {
      const code = extractCodeFromResponse(response);
      if (code) {
        onInsertCode(code);
        toast.success("Kode berhasil disisipkan");
      } else {
        toast.error("Tidak ada kode yang ditemukan dalam respons");
      }
    }
  };

  const handleReplace = () => {
    if (response) {
      const code = extractCodeFromResponse(response);
      if (code) {
        onReplaceCode(code);
        toast.success("Kode berhasil diganti");
      } else {
        toast.error("Tidak ada kode yang ditemukan dalam respons");
      }
    }
  };

  const quickActions = [
    { id: "generate", label: "Generate", icon: Code, desc: "Generate kode HTML baru" },
    { id: "explain", label: "Jelaskan", icon: Lightbulb, desc: "Jelaskan kode HTML saat ini" },
    { id: "fix", label: "Perbaiki", icon: AlertCircle, desc: "Perbaiki error di kode" },
    { id: "optimize", label: "Optimalkan", icon: Wand2, desc: "Optimalkan performa kode" },
    { id: "suggest", label: "Saran", icon: Sparkles, desc: "Dapatkan saran perbaikan" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Provider Selection */}
        <div className="px-6 py-3 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">Provider AI:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setProvider("gemini");
                  setError("");
                  setResponse("");
                }}
                className={`px-3 py-1.5 rounded text-sm transition ${
                  provider === "gemini"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Gemini
              </button>
              <button
                onClick={() => {
                  setProvider("groq");
                  setError("");
                  setResponse("");
                }}
                className={`px-3 py-1.5 rounded text-sm transition ${
                  provider === "groq"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Groq
              </button>
            </div>
          </div>
          
          {/* API Key Input */}
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={provider === "gemini" ? geminiApiKey : groqApiKey}
              onChange={(e) => {
                if (provider === "gemini") {
                  setGeminiApiKey(e.target.value);
                } else {
                  setGroqApiKey(e.target.value);
                }
              }}
              placeholder={
                provider === "gemini"
                  ? "Masukkan Gemini API Key (disimpan di browser)"
                  : "Masukkan Groq API Key (disimpan di browser)"
              }
              className="flex-1 px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={saveApiKey}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
            >
              Simpan
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            API key disimpan di browser Anda. Dapatkan di{" "}
            {provider === "gemini" ? (
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                makersuite.google.com
              </a>
            ) : (
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                console.groq.com
              </a>
            )}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2 flex-wrap">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    setMode(action.id as AIMode);
                    setPrompt("");
                    setResponse("");
                    if (action.id === "generate") {
                      textareaRef.current?.focus();
                    }
                  }}
                  className={`px-3 py-2 rounded text-sm flex items-center gap-2 transition ${
                    mode === action.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                  title={action.desc}
                >
                  <Icon className="w-4 h-4" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Input Area */}
          <div className="px-6 py-4 border-b border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-3">
              {(mode === "generate" || mode === "suggest") && (
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    mode === "generate"
                      ? "Contoh: Buatkan card dengan gambar, judul, dan tombol..."
                      : "Tulis pertanyaan atau permintaan..."
                  }
                  className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              )}
              
              {error && (
                <div className="px-3 py-2 bg-red-900 bg-opacity-30 border border-red-700 rounded text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm flex items-center justify-center gap-2 transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Response Area */}
          <div
            ref={responseRef}
            className="flex-1 overflow-y-auto px-6 py-4 bg-gray-900"
          >
            {response ? (
              <div className="space-y-4">
                <div className="prose prose-invert max-w-none">
                  <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm text-gray-300 whitespace-pre-wrap">
                    {response}
                  </pre>
                </div>
                
                {(mode === "generate" || mode === "fix" || mode === "optimize") && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleInsert}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition"
                    >
                      Sisipkan Kode
                    </button>
                    <button
                      onClick={handleReplace}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition"
                    >
                      Ganti Semua
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                {loading ? "Memproses permintaan..." : "Pilih mode dan kirim permintaan..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


