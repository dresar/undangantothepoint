import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const demoUser = await prisma.user.findFirst({
      where: { email: "demo@example.com" },
    });

    if (!demoUser) {
      return NextResponse.json(
        { error: "Demo user not found. Please seed the database first." },
        { status: 404 }
      );
    }

    const invitation = await prisma.invitation.create({
      data: {
        user_id: demoUser.id,
        slug: data.slug,
        title: data.title,
        theme_template_id: data.theme_template_id,
        music_library_id: data.music_library_id || null,
        is_active: true,
        couple_profiles: {
          create: [
            {
              full_name: data.couple.groom.full_name,
              nickname: data.couple.groom.nickname,
              father_name: data.couple.groom.father_name || null,
              mother_name: data.couple.groom.mother_name || null,
              instagram_link: data.couple.groom.instagram_link || null,
              photo_url: data.couple.groom.photo_url || null,
              order: 1,
              role: "groom",
            },
            {
              full_name: data.couple.bride.full_name,
              nickname: data.couple.bride.nickname,
              father_name: data.couple.bride.father_name || null,
              mother_name: data.couple.bride.mother_name || null,
              instagram_link: data.couple.bride.instagram_link || null,
              photo_url: data.couple.bride.photo_url || null,
              order: 2,
              role: "bride",
            },
          ],
        },
        events: {
          create: data.events.map((event: any, index: number) => ({
            event_name: event.event_name,
            date_start: new Date(event.date_start),
            date_end: event.date_end ? new Date(event.date_end) : null,
            location_name: event.location_name,
            address: event.address,
            map_link: event.map_link || null,
            timezone: event.timezone || "WIB",
            order: index,
          })),
        },
        gallery_items: {
          create: (data.gallery || []).map((item: any, index: number) => ({
            url: item.url,
            caption: item.caption || null,
            type: item.type || "photo",
            order: index,
          })),
        },
        digital_gifts: {
          create: (data.digital_gifts || []).map((gift: any, index: number) => ({
            bank_name: gift.bank_name,
            account_number: gift.account_number,
            account_holder_name: gift.account_holder_name,
            qr_code_url: gift.qr_code_url || null,
            order: index,
          })),
        },
        quotes: {
          create: (data.quotes || []).map((quote: any, index: number) => ({
            title: quote.title || null,
            body: quote.body,
            author: quote.author || null,
            order: index,
          })),
        },
        love_story: data.love_story?.body
          ? {
              create: {
                title: data.love_story.title || null,
                body: data.love_story.body,
              },
            }
          : undefined,
      },
    });

    return NextResponse.json({ slug: invitation.slug, id: invitation.id });
  } catch (error: any) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invitation" },
      { status: 500 }
    );
  }
}

