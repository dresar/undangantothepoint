export interface CoupleProfileForm {
  full_name: string;
  nickname: string;
  father_name: string;
  mother_name: string;
  instagram_link: string;
  photo_url: string;
}

export interface EventForm {
  event_name: string;
  date_start: string;
  date_end: string;
  location_name: string;
  address: string;
  map_link: string;
  timezone: string;
}

export interface GalleryForm {
  url: string;
  caption: string;
  type: "photo" | "video";
}

export interface DigitalGiftForm {
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  qr_code_url: string;
}

export interface QuoteForm {
  title: string;
  body: string;
  author: string;
}

export interface LoveStoryForm {
  title: string;
  body: string;
}

export interface InvitationFormData {
  title: string;
  slug: string;
  theme_template_id: string;
  music_library_id: string;
  couple: {
    groom: CoupleProfileForm;
    bride: CoupleProfileForm;
  };
  events: EventForm[];
  gallery: GalleryForm[];
  digital_gifts: DigitalGiftForm[];
  quotes: QuoteForm[];
  love_story: LoveStoryForm;
}

