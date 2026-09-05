import { create } from "zustand";
import { InvitationFormData } from "@/types/invitation";

interface InvitationStore {
  formData: InvitationFormData;
  updateFormData: (data: Partial<InvitationFormData>) => void;
  resetForm: () => void;
}

const initialFormData: InvitationFormData = {
  title: "",
  slug: "",
  theme_template_id: "",
  music_library_id: "",
  couple: {
    groom: {
      full_name: "",
      nickname: "",
      father_name: "",
      mother_name: "",
      instagram_link: "",
      photo_url: "",
    },
    bride: {
      full_name: "",
      nickname: "",
      father_name: "",
      mother_name: "",
      instagram_link: "",
      photo_url: "",
    },
  },
  events: [],
  gallery: [],
  digital_gifts: [],
  quotes: [],
  love_story: {
    title: "",
    body: "",
  },
};

export const useInvitationStore = create<InvitationStore>((set) => ({
  formData: initialFormData,
  updateFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),
  resetForm: () => set({ formData: initialFormData }),
}));

