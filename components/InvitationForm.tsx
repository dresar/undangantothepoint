"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useInvitationStore } from "@/store/useInvitationStore";
import { generateSlug } from "@/lib/utils";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

const coupleSchema = z.object({
  full_name: z.string().min(1, "Required"),
  nickname: z.string().min(1, "Required"),
  father_name: z.string().optional(),
  mother_name: z.string().optional(),
  instagram_link: z.string().url().optional().or(z.literal("")),
  photo_url: z.string().url().optional().or(z.literal("")),
});

const eventSchema = z.object({
  event_name: z.string().min(1, "Required"),
  date_start: z.string().min(1, "Required"),
  date_end: z.string().optional(),
  location_name: z.string().min(1, "Required"),
  address: z.string().min(1, "Required"),
  map_link: z.string().url().optional().or(z.literal("")),
  timezone: z.string().default("WIB"),
});

const gallerySchema = z.object({
  url: z.string().url("Invalid URL"),
  caption: z.string().optional(),
  type: z.enum(["photo", "video"]).default("photo"),
});

const digitalGiftSchema = z.object({
  bank_name: z.string().min(1, "Required"),
  account_number: z.string().min(1, "Required"),
  account_holder_name: z.string().min(1, "Required"),
  qr_code_url: z.string().url().optional().or(z.literal("")),
});

const quoteSchema = z.object({
  title: z.string().optional(),
  body: z.string().min(1, "Required"),
  author: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(1, "Required"),
  slug: z.string().min(1, "Required"),
  theme_template_id: z.string().min(1, "Select a theme"),
  music_library_id: z.string().optional(),
  couple: z.object({
    groom: coupleSchema,
    bride: coupleSchema,
  }),
  events: z.array(eventSchema).min(1, "Add at least one event"),
  gallery: z.array(gallerySchema).optional(),
  digital_gifts: z.array(digitalGiftSchema).optional(),
  quotes: z.array(quoteSchema).optional(),
  love_story: z.object({
    title: z.string().optional(),
    body: z.string().optional(),
  }),
});

type FormData = z.infer<typeof formSchema>;

interface InvitationFormProps {
  themes: any[];
  musicTracks: any[];
}

export function InvitationForm({ themes, musicTracks }: InvitationFormProps) {
  const { formData, updateFormData } = useInvitationStore();
  const [openSections, setOpenSections] = useState<string[]>([
    "theme",
    "couple",
    "events",
  ]);

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: formData,
    mode: "onChange",
  });

  const {
    fields: eventFields,
    append: appendEvent,
    remove: removeEvent,
  } = useFieldArray({
    control,
    name: "events",
  });

  const {
    fields: galleryFields,
    append: appendGallery,
    remove: removeGallery,
  } = useFieldArray({
    control,
    name: "gallery",
  });

  const {
    fields: giftFields,
    append: appendGift,
    remove: removeGift,
  } = useFieldArray({
    control,
    name: "digital_gifts",
  });

  const {
    fields: quoteFields,
    append: appendQuote,
    remove: removeQuote,
  } = useFieldArray({
    control,
    name: "quotes",
  });

  const watchedData = watch();

  const groomNickname = watch("couple.groom.nickname");
  const brideNickname = watch("couple.bride.nickname");

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleSlugGeneration = () => {
    if (groomNickname && brideNickname) {
      const slug = `${generateSlug(groomNickname)}-${generateSlug(brideNickname)}`;
      setValue("slug", slug);
    }
  };

  useEffect(() => {
    if (groomNickname && brideNickname) {
      const slug = `${generateSlug(groomNickname)}-${generateSlug(brideNickname)}`;
      setValue("slug", slug);
    }
  }, [groomNickname, brideNickname, setValue]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFormData(watchedData);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [watchedData, updateFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = watchedData;
    try {
      const response = await fetch("/api/invitation/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const result = await response.json();
        window.location.href = `/invitation/${result.slug}`;
      }
    } catch (error) {
      console.error("Failed to create invitation:", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Invitation</h1>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Publish
        </button>
      </div>

      <form className="space-y-4">
        <Section
          title="Theme Selection"
          isOpen={openSections.includes("theme")}
          onToggle={() => toggleSection("theme")}
        >
          <div className="grid grid-cols-3 gap-4">
            {themes.map((theme) => (
              <label
                key={theme.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  watchedData.theme_template_id === theme.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  value={theme.id}
                  {...register("theme_template_id")}
                  className="hidden"
                />
                <img
                  src={theme.thumbnail_url}
                  alt={theme.name}
                  className="w-full h-32 object-cover rounded mb-2"
                />
                <p className="font-medium">{theme.name}</p>
              </label>
            ))}
          </div>
          {errors.theme_template_id && (
            <p className="text-red-500 text-sm mt-1">
              {errors.theme_template_id.message}
            </p>
          )}
        </Section>

        <Section
          title="Basic Info"
          isOpen={openSections.includes("basic")}
          onToggle={() => toggleSection("basic")}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                {...register("title")}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="The Wedding of..."
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                {...register("slug")}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                placeholder="auto-generated"
              />
              <button
                type="button"
                onClick={handleSlugGeneration}
                className="text-sm text-blue-600 mt-1"
              >
                Regenerate
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Music</label>
              <select
                {...register("music_library_id")}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">None</option>
                {musicTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title} - {track.artist}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        <Section
          title="Couple Information"
          isOpen={openSections.includes("couple")}
          onToggle={() => toggleSection("couple")}
        >
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3">Groom</h3>
              <CoupleFields
                prefix="couple.groom"
                register={register}
                errors={errors.couple?.groom}
              />
            </div>
            <div>
              <h3 className="font-medium mb-3">Bride</h3>
              <CoupleFields
                prefix="couple.bride"
                register={register}
                errors={errors.couple?.bride}
              />
            </div>
          </div>
        </Section>

        <Section
          title="Events"
          isOpen={openSections.includes("events")}
          onToggle={() => toggleSection("events")}
        >
          <div className="space-y-4">
            {eventFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Event {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeEvent(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <EventFields
                  index={index}
                  register={register}
                  control={control}
                  errors={errors.events?.[index]}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                appendEvent({
                  event_name: "",
                  date_start: "",
                  date_end: "",
                  location_name: "",
                  address: "",
                  map_link: "",
                  timezone: "WIB",
                })
              }
              className="flex items-center gap-2 text-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          </div>
        </Section>

        <Section
          title="Gallery"
          isOpen={openSections.includes("gallery")}
          onToggle={() => toggleSection("gallery")}
        >
          <div className="space-y-4">
            {galleryFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeGallery(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    {...register(`gallery.${index}.url`)}
                    placeholder="Image/Video URL"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    {...register(`gallery.${index}.caption`)}
                    placeholder="Caption"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <select
                    {...register(`gallery.${index}.type`)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="photo">Photo</option>
                    <option value="video">Video</option>
                  </select>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                appendGallery({ url: "", caption: "", type: "photo" })
              }
              className="flex items-center gap-2 text-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Gallery Item
            </button>
          </div>
        </Section>

        <Section
          title="Digital Gifts"
          isOpen={openSections.includes("gifts")}
          onToggle={() => toggleSection("gifts")}
        >
          <div className="space-y-4">
            {giftFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Account {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeGift(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <GiftFields
                  index={index}
                  register={register}
                  errors={errors.digital_gifts?.[index]}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                appendGift({
                  bank_name: "",
                  account_number: "",
                  account_holder_name: "",
                  qr_code_url: "",
                })
              }
              className="flex items-center gap-2 text-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Bank Account
            </button>
          </div>
        </Section>

        <Section
          title="Quotes"
          isOpen={openSections.includes("quotes")}
          onToggle={() => toggleSection("quotes")}
        >
          <div className="space-y-4">
            {quoteFields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Quote {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeQuote(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    {...register(`quotes.${index}.title`)}
                    placeholder="Title (optional)"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <textarea
                    {...register(`quotes.${index}.body`)}
                    placeholder="Quote text"
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                  <input
                    {...register(`quotes.${index}.author`)}
                    placeholder="Author (optional)"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                appendQuote({ title: "", body: "", author: "" })
              }
              className="flex items-center gap-2 text-blue-600"
            >
              <Plus className="w-4 h-4" />
              Add Quote
            </button>
          </div>
        </Section>

        <Section
          title="Love Story"
          isOpen={openSections.includes("story")}
          onToggle={() => toggleSection("story")}
        >
          <div className="space-y-4">
            <input
              {...register("love_story.title")}
              placeholder="Story Title (optional)"
              className="w-full px-3 py-2 border rounded-lg"
            />
            <textarea
              {...register("love_story.body")}
              placeholder="Your love story..."
              className="w-full px-3 py-2 border rounded-lg"
              rows={6}
            />
          </div>
        </Section>
      </form>
    </div>
  );
}

function Section({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
      >
        <span className="font-medium">{title}</span>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

function CoupleFields({
  prefix,
  register,
  errors,
}: {
  prefix: string;
  register: any;
  errors: any;
}) {
  return (
    <div className="space-y-2">
      <input
        {...register(`${prefix}.full_name`)}
        placeholder="Full Name"
        className="w-full px-3 py-2 border rounded-lg"
      />
      {errors?.full_name && (
        <p className="text-red-500 text-sm">{errors.full_name.message}</p>
      )}
      <input
        {...register(`${prefix}.nickname`)}
        placeholder="Nickname"
        className="w-full px-3 py-2 border rounded-lg"
      />
      {errors?.nickname && (
        <p className="text-red-500 text-sm">{errors.nickname.message}</p>
      )}
      <input
        {...register(`${prefix}.father_name`)}
        placeholder="Father's Name"
        className="w-full px-3 py-2 border rounded-lg"
      />
      <input
        {...register(`${prefix}.mother_name`)}
        placeholder="Mother's Name"
        className="w-full px-3 py-2 border rounded-lg"
      />
      <input
        {...register(`${prefix}.instagram_link`)}
        placeholder="Instagram URL"
        className="w-full px-3 py-2 border rounded-lg"
      />
      <input
        {...register(`${prefix}.photo_url`)}
        placeholder="Photo URL"
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>
  );
}

function EventFields({
  index,
  register,
  control,
  errors,
}: {
  index: number;
  register: any;
  control: any;
  errors: any;
}) {
  return (
    <div className="space-y-2">
      <input
        {...register(`events.${index}.event_name`)}
        placeholder="Event Name (e.g., Akad Nikah)"
        className="w-full px-3 py-2 border rounded-lg"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="datetime-local"
          {...register(`events.${index}.date_start`)}
          className="w-full px-3 py-2 border rounded-lg"
        />
        <input
          type="datetime-local"
          {...register(`events.${index}.date_end`)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <input
        {...register(`events.${index}.location_name`)}
        placeholder="Location Name"
        className="w-full px-3 py-2 border rounded-lg"
      />
      <textarea
        {...register(`events.${index}.address`)}
        placeholder="Full Address"
        className="w-full px-3 py-2 border rounded-lg"
        rows={2}
      />
      <input
        {...register(`events.${index}.map_link`)}
        placeholder="Google Maps URL"
        className="w-full px-3 py-2 border rounded-lg"
      />
      <select
        {...register(`events.${index}.timezone`)}
        className="w-full px-3 py-2 border rounded-lg"
      >
        <option value="WIB">WIB</option>
        <option value="WITA">WITA</option>
        <option value="WIT">WIT</option>
      </select>
    </div>
  );
}

function GiftFields({
  index,
  register,
  errors,
}: {
  index: number;
  register: any;
  errors: any;
}) {
  return (
    <div className="space-y-2">
      <input
        {...register(`digital_gifts.${index}.bank_name`)}
        placeholder="Bank Name"
        className="w-full px-3 py-2 border rounded-lg"
      />
      <input
        {...register(`digital_gifts.${index}.account_number`)}
        placeholder="Account Number"
        className="w-full px-3 py-2 border rounded-lg"
      />
      <input
        {...register(`digital_gifts.${index}.account_holder_name`)}
        placeholder="Account Holder Name"
        className="w-full px-3 py-2 border rounded-lg"
      />
      <input
        {...register(`digital_gifts.${index}.qr_code_url`)}
        placeholder="QR Code URL (optional)"
        className="w-full px-3 py-2 border rounded-lg"
      />
    </div>
  );
}

