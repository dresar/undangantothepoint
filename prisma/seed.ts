import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================
  // CLEANUP: Clear existing data (optional, for development)
  // ============================================
  console.log('🧹 Cleaning up existing data...');
  await prisma.guestBook.deleteMany();
  await prisma.loveStory.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.digitalGift.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.event.deleteMany();
  await prisma.coupleProfile.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.digitalAsset.deleteMany();
  await prisma.musicLibrary.deleteMany();
  await prisma.themeTemplate.deleteMany();

  // ============================================
  // SYSTEM ASSETS: Theme Templates
  // ============================================
  console.log('🎨 Creating theme templates...');
  
  const themeRedBeige = await prisma.themeTemplate.create({
    data: {
      name: 'Red Beige',
      description: 'Elegant red and beige color scheme perfect for traditional weddings',
      thumbnail_url: 'https://example.com/themes/red-beige-thumbnail.jpg',
      ejs_file_path: '/templates/red-beige.ejs',
      style_config_json: {
        primaryColor: '#C41E3A',
        secondaryColor: '#F5F5DC',
        accentColor: '#8B4513',
        fontFamily: 'Playfair Display',
        fontSize: {
          heading: '2.5rem',
          body: '1rem'
        }
      },
      category: 'traditional',
      is_active: true,
      price: 0
    }
  });

  const themeBlueOcean = await prisma.themeTemplate.create({
    data: {
      name: 'Blue Ocean',
      description: 'Modern blue ocean theme with fresh and clean aesthetics',
      thumbnail_url: 'https://example.com/themes/blue-ocean-thumbnail.jpg',
      ejs_file_path: '/templates/blue-ocean.ejs',
      style_config_json: {
        primaryColor: '#1E3A8A',
        secondaryColor: '#E0F2FE',
        accentColor: '#0EA5E9',
        fontFamily: 'Inter',
        fontSize: {
          heading: '2rem',
          body: '1rem'
        }
      },
      category: 'modern',
      is_active: true,
      price: 0
    }
  });

  const themeJavaneseClassic = await prisma.themeTemplate.create({
    data: {
      name: 'Javanese Classic',
      description: 'Traditional Javanese design with batik-inspired patterns',
      thumbnail_url: 'https://example.com/themes/javanese-classic-thumbnail.jpg',
      ejs_file_path: '/templates/javanese-classic.ejs',
      style_config_json: {
        primaryColor: '#8B4513',
        secondaryColor: '#F4A460',
        accentColor: '#CD853F',
        fontFamily: 'Cormorant Garamond',
        fontSize: {
          heading: '2.5rem',
          body: '1.1rem'
        },
        pattern: 'batik'
      },
      category: 'traditional',
      is_active: true,
      price: 0
    }
  });

  console.log(`✅ Created ${3} theme templates`);

  // ============================================
  // SYSTEM ASSETS: Music Library
  // ============================================
  console.log('🎵 Creating music library...');

  const music1 = await prisma.musicLibrary.create({
    data: {
      title: 'Canon in D',
      artist: 'Johann Pachelbel',
      audio_url: 'https://example.com/music/canon-in-d.mp3',
      thumbnail_url: 'https://example.com/music/canon-in-d-cover.jpg',
      category: 'classical',
      duration: 300,
      is_active: true
    }
  });

  const music2 = await prisma.musicLibrary.create({
    data: {
      title: 'A Thousand Years',
      artist: 'Christina Perri',
      audio_url: 'https://example.com/music/a-thousand-years.mp3',
      thumbnail_url: 'https://example.com/music/a-thousand-years-cover.jpg',
      category: 'romantic',
      duration: 280,
      is_active: true
    }
  });

  const music3 = await prisma.musicLibrary.create({
    data: {
      title: 'Perfect',
      artist: 'Ed Sheeran',
      audio_url: 'https://example.com/music/perfect.mp3',
      thumbnail_url: 'https://example.com/music/perfect-cover.jpg',
      category: 'romantic',
      duration: 263,
      is_active: true
    }
  });

  const music4 = await prisma.musicLibrary.create({
    data: {
      title: 'Wedding March',
      artist: 'Felix Mendelssohn',
      audio_url: 'https://example.com/music/wedding-march.mp3',
      thumbnail_url: 'https://example.com/music/wedding-march-cover.jpg',
      category: 'classical',
      duration: 240,
      is_active: true
    }
  });

  const music5 = await prisma.musicLibrary.create({
    data: {
      title: 'All of Me',
      artist: 'John Legend',
      audio_url: 'https://example.com/music/all-of-me.mp3',
      thumbnail_url: 'https://example.com/music/all-of-me-cover.jpg',
      category: 'romantic',
      duration: 269,
      is_active: true
    }
  });

  console.log(`✅ Created ${5} music tracks`);

  // ============================================
  // SYSTEM ASSETS: Digital Assets (Optional - for editor)
  // ============================================
  console.log('🎨 Creating digital assets...');

  await prisma.digitalAsset.createMany({
    data: [
      {
        name: 'Rose Sticker',
        type: 'sticker',
        url: 'https://example.com/assets/stickers/rose.png',
        thumbnail_url: 'https://example.com/assets/stickers/rose-thumb.png',
        category: 'flowers',
        tags: ['rose', 'flower', 'romantic'], // JSON array for MySQL
        is_premium: false,
        is_active: true
      },
      {
        name: 'Heart Shape',
        type: 'shape',
        url: 'https://example.com/assets/shapes/heart.svg',
        thumbnail_url: 'https://example.com/assets/shapes/heart-thumb.png',
        category: 'hearts',
        tags: ['heart', 'love', 'romantic'], // JSON array for MySQL
        is_premium: false,
        is_active: true
      },
      {
        name: 'Gold Frame',
        type: 'frame',
        url: 'https://example.com/assets/frames/gold-frame.png',
        thumbnail_url: 'https://example.com/assets/frames/gold-frame-thumb.png',
        category: 'frames',
        tags: ['frame', 'gold', 'elegant'], // JSON array for MySQL
        is_premium: true,
        is_active: true
      }
    ]
  });

  console.log(`✅ Created digital assets`);

  // ============================================
  // USER DATA: Create Demo User
  // ============================================
  console.log('👤 Creating demo user...');

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: '$2a$10$dummyhashedpasswordfordemopurposesonly' // In production, use proper hashing
    }
  });

  console.log(`✅ Created demo user: ${demoUser.email}`);

  // ============================================
  // USER DATA: Create Complete Demo Invitation
  // ============================================
  console.log('💌 Creating demo invitation...');

  const demoInvitation = await prisma.invitation.create({
    data: {
      user_id: demoUser.id,
      slug: 'romeo-juliet',
      title: 'The Wedding of Romeo & Juliet',
      theme_template_id: themeRedBeige.id,
      music_library_id: music1.id,
      is_active: true,
      
      // Couple Profiles
      couple_profiles: {
        create: [
          {
            full_name: 'Romeo Montague',
            nickname: 'Romeo',
            father_name: 'Lord Montague',
            mother_name: 'Lady Montague',
            instagram_link: 'https://instagram.com/romeo_montague',
            photo_url: 'https://example.com/photos/romeo.jpg',
            order: 1,
            role: 'groom'
          },
          {
            full_name: 'Juliet Capulet',
            nickname: 'Juliet',
            father_name: 'Lord Capulet',
            mother_name: 'Lady Capulet',
            instagram_link: 'https://instagram.com/juliet_capulet',
            photo_url: 'https://example.com/photos/juliet.jpg',
            order: 2,
            role: 'bride'
          }
        ]
      },
      
      // Events
      events: {
        create: [
          {
            event_name: 'Akad Nikah',
            date_start: new Date('2024-03-15T08:00:00.000Z'),
            date_end: new Date('2024-03-15T10:00:00.000Z'),
            location_name: 'Masjid Agung Jakarta',
            address: 'Jl. Thamrin No. 1, Jakarta Pusat, DKI Jakarta 10230',
            map_link: 'https://maps.google.com/?q=Masjid+Agung+Jakarta',
            timezone: 'WIB',
            order: 1
          },
          {
            event_name: 'Resepsi',
            date_start: new Date('2024-03-15T18:00:00.000Z'),
            date_end: new Date('2024-03-15T22:00:00.000Z'),
            location_name: 'Hotel Majapahit',
            address: 'Jl. Tunjungan No. 65, Surabaya, Jawa Timur 60261',
            map_link: 'https://maps.google.com/?q=Hotel+Majapahit+Surabaya',
            timezone: 'WIB',
            order: 2
          },
          {
            event_name: 'Unduh Mantu',
            date_start: new Date('2024-03-16T10:00:00.000Z'),
            date_end: new Date('2024-03-16T14:00:00.000Z'),
            location_name: 'Rumah Keluarga Montague',
            address: 'Jl. Kemang Raya No. 10, Jakarta Selatan, DKI Jakarta 12730',
            map_link: 'https://maps.google.com/?q=Rumah+Keluarga+Montague',
            timezone: 'WIB',
            order: 3
          }
        ]
      },
      
      // Gallery
      gallery_items: {
        create: [
          {
            url: 'https://example.com/gallery/photo1.jpg',
            caption: 'Our first meeting',
            type: 'photo',
            order: 1
          },
          {
            url: 'https://example.com/gallery/photo2.jpg',
            caption: 'Engagement day',
            type: 'photo',
            order: 2
          },
          {
            url: 'https://example.com/gallery/photo3.jpg',
            caption: 'Pre-wedding photoshoot',
            type: 'photo',
            order: 3
          }
        ]
      },
      
      // Digital Gifts
      digital_gifts: {
        create: [
          {
            bank_name: 'BCA',
            account_number: '1234567890',
            account_holder_name: 'Romeo Montague',
            qr_code_url: 'https://example.com/qr/bca-qr.png',
            order: 1
          },
          {
            bank_name: 'Mandiri',
            account_number: '0987654321',
            account_holder_name: 'Juliet Capulet',
            qr_code_url: 'https://example.com/qr/mandiri-qr.png',
            order: 2
          }
        ]
      },
      
      // Guest Book (Sample entries)
      guest_book: {
        create: [
          {
            guest_name: 'Mercutio',
            message: 'Congratulations! May your love story be as beautiful as Shakespeare\'s tale. Wishing you both eternal happiness!',
            attendance_status: 'Hadir',
            email: 'mercutio@example.com',
            phone: '+6281234567890'
          },
          {
            guest_name: 'Benvolio',
            message: 'So happy for you both! Can\'t wait to celebrate with you.',
            attendance_status: 'Hadir'
          },
          {
            guest_name: 'Tybalt',
            message: 'Best wishes for your future together.',
            attendance_status: 'Tidak',
            email: 'tybalt@example.com'
          }
        ]
      },
      
      // Quotes
      quotes: {
        create: [
          {
            title: 'Opening Quote',
            body: 'Two households, both alike in dignity, In fair Verona, where we lay our scene...',
            author: 'William Shakespeare',
            order: 1
          },
          {
            body: 'Love is not love which alters when it alteration finds.',
            author: 'William Shakespeare',
            order: 2
          }
        ]
      },
      
      // Love Story
      love_story: {
        create: {
          title: 'Our Love Story',
          body: '<p>It all began on a beautiful spring day in Verona...</p><p>We met at a masquerade ball, and from that moment, we knew our lives would never be the same.</p><p>Through trials and tribulations, our love only grew stronger. Today, we are ready to begin our journey together as husband and wife.</p>'
        }
      }
    }
  });

  console.log(`✅ Created demo invitation: ${demoInvitation.slug}`);
  console.log(`   Theme: ${themeRedBeige.name}`);
  console.log(`   Music: ${music1.title} by ${music1.artist}`);
  console.log(`   Couple: Romeo & Juliet`);
  console.log(`   Events: ${3}`);
  console.log(`   Gallery Items: ${3}`);
  console.log(`   Guest Book Entries: ${3}`);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   ✅ ${3} Theme Templates`);
  console.log(`   ✅ ${5} Music Tracks`);
  console.log(`   ✅ ${3} Digital Assets`);
  console.log(`   ✅ ${1} Demo User`);
  console.log(`   ✅ ${1} Complete Demo Invitation`);
  console.log('\n🔗 Access your demo invitation at: /invitation/romeo-juliet');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

