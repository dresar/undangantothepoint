/**
 * CDN Detector untuk CSS dan JS
 * Mendeteksi library yang digunakan dan menyediakan link CDN yang kompatibel
 */

export interface CDNMatch {
  library: string;
  version?: string;
  cdnLinks: {
    jsdelivr?: string;
    unpkg?: string;
    cdnjs?: string;
    js?: string;
    css?: string;
  };
  detected: boolean;
  confidence: number; // 0-100
}

// Daftar library populer dengan pattern detection
const CDN_LIBRARIES = [
  {
    name: "jQuery",
    patterns: [
      /jquery[.-]?(\d+\.\d+\.\d+)?/i,
      /\$\(/,
      /jQuery\(/,
    ],
    cdn: {
      jsdelivr: (version: string) => `https://cdn.jsdelivr.net/npm/jquery@${version}/dist/jquery.min.js`,
      unpkg: (version: string) => `https://unpkg.com/jquery@${version}/dist/jquery.min.js`,
      cdnjs: (version: string) => `https://cdnjs.cloudflare.com/ajax/libs/jquery/${version}/jquery.min.js`,
    },
    defaultVersion: "3.7.1",
  },
  {
    name: "Bootstrap",
    patterns: [
      /bootstrap[.-]?(\d+\.\d+\.\d+)?/i,
      /\.container/,
      /\.btn-primary/,
    ],
    cdn: {
      jsdelivr: (version: string) => `https://cdn.jsdelivr.net/npm/bootstrap@${version}/dist/js/bootstrap.bundle.min.js`,
      css: (version: string) => `https://cdn.jsdelivr.net/npm/bootstrap@${version}/dist/css/bootstrap.min.css`,
      unpkg: (version: string) => `https://unpkg.com/bootstrap@${version}/dist/js/bootstrap.bundle.min.js`,
      cdnjs: (version: string) => `https://cdnjs.cloudflare.com/ajax/libs/bootstrap/${version}/js/bootstrap.bundle.min.js`,
    },
    defaultVersion: "5.3.2",
  },
  {
    name: "Font Awesome",
    patterns: [
      /font-awesome/i,
      /fontawesome/i,
      /fa-[a-z-]+/,
      /fas\s|far\s|fab\s/,
    ],
    cdn: {
      jsdelivr: (version: string) => `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@${version}/js/all.min.js`,
      css: (version: string) => `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@${version}/css/all.min.css`,
      cdnjs: (version: string) => `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/${version}/css/all.min.css`,
    },
    defaultVersion: "6.5.1",
  },
  {
    name: "AOS (Animate On Scroll)",
    patterns: [
      /aos[.-]?(\d+\.\d+\.\d+)?/i,
      /data-aos=/,
      /AOS\.init/,
    ],
    cdn: {
      jsdelivr: (version: string) => `https://cdn.jsdelivr.net/npm/aos@${version}/dist/aos.js`,
      css: (version: string) => `https://cdn.jsdelivr.net/npm/aos@${version}/dist/aos.css`,
      cdnjs: (version: string) => `https://cdnjs.cloudflare.com/ajax/libs/aos/${version}/aos.css`,
    },
    defaultVersion: "2.3.4",
  },
  {
    name: "Swiper",
    patterns: [
      /swiper[.-]?(\d+\.\d+\.\d+)?/i,
      /new Swiper/,
      /swiper-container/,
    ],
    cdn: {
      jsdelivr: (version: string) => `https://cdn.jsdelivr.net/npm/swiper@${version}/swiper-bundle.min.js`,
      css: (version: string) => `https://cdn.jsdelivr.net/npm/swiper@${version}/swiper-bundle.min.css`,
      cdnjs: (version: string) => `https://cdnjs.cloudflare.com/ajax/libs/Swiper/${version}/swiper-bundle.min.js`,
    },
    defaultVersion: "11.0.5",
  },
  {
    name: "GSAP",
    patterns: [
      /gsap[.-]?(\d+\.\d+\.\d+)?/i,
      /gsap\./,
      /TweenMax|TweenLite/,
    ],
    cdn: {
      jsdelivr: (version: string) => `https://cdn.jsdelivr.net/npm/gsap@${version}/dist/gsap.min.js`,
      cdnjs: (version: string) => `https://cdnjs.cloudflare.com/ajax/libs/gsap/${version}/gsap.min.js`,
    },
    defaultVersion: "3.12.2",
  },
  {
    name: "Animate.css",
    patterns: [
      /animate\.css/i,
      /animate__/,
      /animated\s/,
    ],
    cdn: {
      jsdelivr: (version: string) => `https://cdn.jsdelivr.net/npm/animate.css@${version}/animate.min.css`,
      cdnjs: (version: string) => `https://cdnjs.cloudflare.com/ajax/libs/animate.css/${version}/animate.min.css`,
    },
    defaultVersion: "4.1.1",
  },
];

/**
 * Deteksi library dari content file
 */
export function detectCDNFromContent(content: string, fileName: string): CDNMatch[] {
  const matches: CDNMatch[] = [];

  CDN_LIBRARIES.forEach((library) => {
    let detected = false;
    let version = library.defaultVersion;
    let confidence = 0;

    // Check patterns
    library.patterns.forEach((pattern) => {
      const match = content.match(pattern);
      if (match) {
        detected = true;
        confidence += 30;

        // Extract version if available
        if (match[1]) {
          version = match[1];
          confidence += 20;
        }
      }
    });

    // Check filename
    if (fileName.toLowerCase().includes(library.name.toLowerCase().replace(/\s+/g, "-"))) {
      detected = true;
      confidence += 40;
    }

    if (detected && confidence > 30) {
      const cdnLinks: any = {};
      
      // Generate CDN links
      Object.keys(library.cdn).forEach((provider) => {
        const linkGenerator = library.cdn[provider as keyof typeof library.cdn];
        if (typeof linkGenerator === "function") {
          cdnLinks[provider] = linkGenerator(version);
        }
      });

      matches.push({
        library: library.name,
        version,
        cdnLinks,
        detected: true,
        confidence: Math.min(100, confidence),
      });
    }
  });

  return matches;
}

/**
 * Deteksi apakah file sudah menggunakan CDN
 */
export function isCDNLink(path: string): boolean {
  const cdnPatterns = [
    /^https?:\/\/(cdn\.|unpkg\.|cdnjs\.|jsdelivr\.)/i,
    /^\/\/cdn\./i,
    /cdnjs\.cloudflare\.com/i,
    /unpkg\.com/i,
    /jsdelivr\.net/i,
  ];

  return cdnPatterns.some((pattern) => pattern.test(path));
}

/**
 * Extract library name dari CDN URL
 */
export function extractLibraryFromCDN(url: string): { name: string; version?: string } | null {
  // jsdelivr pattern: cdn.jsdelivr.net/npm/library@version
  const jsdelivrMatch = url.match(/jsdelivr\.net\/npm\/([^@\/]+)@?([^\/]+)?/i);
  if (jsdelivrMatch) {
    return {
      name: jsdelivrMatch[1],
      version: jsdelivrMatch[2],
    };
  }

  // unpkg pattern: unpkg.com/library@version
  const unpkgMatch = url.match(/unpkg\.com\/([^@\/]+)@?([^\/]+)?/i);
  if (unpkgMatch) {
    return {
      name: unpkgMatch[1],
      version: unpkgMatch[2],
    };
  }

  // cdnjs pattern: cdnjs.cloudflare.com/ajax/libs/library/version
  const cdnjsMatch = url.match(/cdnjs\.cloudflare\.com\/ajax\/libs\/([^\/]+)\/([^\/]+)/i);
  if (cdnjsMatch) {
    return {
      name: cdnjsMatch[1],
      version: cdnjsMatch[2],
    };
  }

  return null;
}

