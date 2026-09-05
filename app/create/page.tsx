"use client";

import { useEffect, useState } from "react";
import { InvitationForm } from "@/components/InvitationForm";
import { LivePreview } from "@/components/LivePreview";

export default function CreatePage() {
  const [themes, setThemes] = useState<any[]>([]);
  const [musicTracks, setMusicTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const [themesRes, musicRes] = await Promise.all([
          fetch("/api/themes"),
          fetch("/api/music"),
        ]);
        const themesData = await themesRes.json();
        const musicData = await musicRes.json();
        setThemes(themesData);
        setMusicTracks(musicData);
      } catch (error) {
        console.error("Failed to fetch assets:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAssets();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="w-1/2 overflow-y-auto border-r border-gray-200">
        <InvitationForm themes={themes} musicTracks={musicTracks} />
      </div>
      <div className="w-1/2 sticky top-0 h-screen overflow-y-auto bg-gray-100 flex items-center justify-center">
        <LivePreview themes={themes} />
      </div>
    </div>
  );
}

