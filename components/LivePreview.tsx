"use client";

import { useInvitationStore } from "@/store/useInvitationStore";

interface LivePreviewProps {
  themes: any[];
}

export function LivePreview({ themes }: LivePreviewProps) {
  const { formData } = useInvitationStore();
  const selectedTheme = themes.find(
    (t) => t.id === formData.theme_template_id
  );

  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-[375px] h-[667px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-8 border-gray-800">
        <div className="h-full overflow-y-auto bg-white p-8">
          {selectedTheme ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">{formData.title || "Wedding Invitation"}</h2>
              {formData.couple?.groom?.full_name && formData.couple?.bride?.full_name && (
                <p className="text-lg mb-4">
                  {formData.couple.groom.full_name} & {formData.couple.bride.full_name}
                </p>
              )}
              <p className="text-gray-500">Preview untuk template: {selectedTheme.name}</p>
              <p className="text-sm text-gray-400 mt-4">Template akan dirender dari file HTML</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              Select a theme to preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

