// app.js
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const { URL } = require('url');

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB

// --- Social network detection config ----------------------------------------

const SOCIAL_DOMAINS = {
  facebook: ['facebook.com'],
  linkedin: ['linkedin.com'],
  twitter: ['twitter.com', 'x.com'],
  youtube: ['youtube.com', 'youtu.be'],
  discord: ['discord.com'],
  instagram: ['instagram.com'],
  pinterest: ['pinterest.com'],
  snapchat: ['snapchat.com'],
  tiktok: ['tiktok.com']
};

function emptySocialProfiles() {
  return {
    facebook: null,
    linkedin: null,
    twitter: null,
    youtube: null,
    discord: null,
    instagram: null,
    pinterest: null,
    snapchat: null,
    tiktok: null
  };
}

// --- Main function -----------------------------------------------------------

/**
 * Main function: attempts to find and return the company logo and social profiles
 * for a given URL.
 *
 * @param {string} targetUrl
 * @returns {Promise<{
 *   success: boolean,
 *   message: string,
 *   logo?: {
 *     url: string,
 *     size: number,
 *     contentType: string,
 *     data: Buffer
 *   },
 *   socialProfiles?: {
 *     facebook: string | null,
 *     linkedin: string | null,
 *     twitter: string | null,
 *     youtube: string | null,
 *     discord: string | null,
 *     instagram: string | null,
 *     pinterest: string | null,
 *     snapchat: string | null,
 *     tiktok: string | null
 *   }
 * }>}
 */
async function fetchCompanyLogo(targetUrl) {
  // 1) Empty URL
  if (!targetUrl || !String(targetUrl).trim()) {
    return {
      success: false,
      message: 'False'
    };
  }

  // 2) Malformed URL
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (err) {
    return {
      success: false,
      message: 'Malformed URL'
    };
  }

  const canonicalUrl = parsedUrl.toString();

  // 3) Fetch and parse the website
  let finalResult;

  try {
    const pageRes = await fetch(canonicalUrl, { redirect: 'follow' });
    if (!pageRes.ok) {
      finalResult = {
        success: false,
        message: 'could not identify logo',
        socialProfiles: emptySocialProfiles()
      };
    } else {
      const html = await pageRes.text();
      const $ = cheerio.load(html);

      // Extract social links
      const socialProfiles = extractSocialProfiles($, parsedUrl);

      // Collect candidate logo <img> elements (JPEG/JPG/PNG only)
      const candidates = [];
      $('img').each((_, el) => {
        const $el = $(el);
        const src = ($el.attr('src') || '').trim();

        if (!src || src.startsWith('data:')) return; // ignore data URLs

        const lowerSrc = src.toLowerCase();
        // Only accept .jpg/.jpeg/.png
        if (!/\.(jpe?g|png)(\?|#|$)/.test(lowerSrc)) return;

        const alt = ($el.attr('alt') || '').toLowerCase();
        const id = ($el.attr('id') || '').toLowerCase();
        const cls = ($el.attr('class') || '').toLowerCase();

        const score = scoreImageCandidate({ src: lowerSrc, alt, id, cls });

        const absoluteUrl = new URL(src, parsedUrl).toString();
        candidates.push({ url: absoluteUrl, score });
      });

      if (candidates.length === 0) {
        finalResult = {
          success: false,
          message: 'could not identify logo',
          socialProfiles
        };
      } else {
        // Sort candidates by descending score (best first)
        candidates.sort((a, b) => b.score - a.score);

        let chosenResult = null;

        for (const candidate of candidates) {
          const logoCheck = await downloadAndValidateImage(candidate.url);
          if (logoCheck.ok && !logoCheck.tooLarge && logoCheck.logo) {
            // Valid logo under size limit
            chosenResult = {
              success: true,
              message: 'OK',
              logo: logoCheck.logo,
              socialProfiles
            };
            break;
          }

          if (logoCheck.tooLarge) {
            // Immediately stop and return specific failure for size
            chosenResult = {
              success: false,
              message: 'logo greater than image limit',
              socialProfiles
            };
            break;
          }

          // For other failures (unsupported type/fetch error), try next candidate
        }

        if (chosenResult) {
          finalResult = chosenResult;
        } else {
          finalResult = {
            success: false,
            message: 'could not identify logo',
            socialProfiles
          };
        }
      }
    }
  } catch (err) {
    console.error('Error fetching/parsing URL:', err);
    finalResult = {
      success: false,
      message: 'could not identify logo',
      socialProfiles: emptySocialProfiles()
    };
  }

  return finalResult;
}

// --- HTML / image helpers ----------------------------------------------------

function scoreImageCandidate({ src, alt, id, cls }) {
  let score = 0;
  const haystack = `${src} ${alt} ${id} ${cls}`;

  if (haystack.includes('logo')) score += 10;
  if (haystack.includes('brand')) score += 4;
  if (haystack.includes('header') || haystack.includes('navbar')) score += 2;
  if (haystack.includes('site') || haystack.includes('main')) score += 1;

  // Slight bonus if in filename path near start (e.g. /img/logo.png)
  if (/\/logo\./.test(src)) score += 5;

  return score;
}

async function downloadAndValidateImage(imageUrl) {
  try {
    const res = await fetch(imageUrl, { redirect: 'follow' });
    if (!res.ok) {
      return { ok: false, reason: 'fetch_failed' };
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isJpeg =
      contentType.startsWith('image/jpeg') || contentType.startsWith('image/jpg');
    const isPng = contentType.startsWith('image/png');

    // Only JPEG/JPG/PNG allowed
    if (!isJpeg && !isPng) {
      return { ok: false, reason: 'unsupported_type' };
    }

    const buffer = await res.buffer();
    const size = buffer.length;

    if (size >= MAX_LOGO_BYTES) {
      return {
        ok: false,
        tooLarge: true,
        reason: 'too_large',
        size
      };
    }

    return {
      ok: true,
      tooLarge: false,
      logo: {
        url: imageUrl,
        size,
        contentType,
        data: buffer
      }
    };
  } catch (err) {
    return { ok: false, reason: 'download_error' };
  }
}

/**
 * Extract social network profile URLs from page <a> tags.
 */
function extractSocialProfiles($, baseUrl) {
  const found = emptySocialProfiles();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    let absolute;
    try {
      absolute = new URL(href, baseUrl).toString();
    } catch {
      return;
    }

    let hostname;
    try {
      hostname = new URL(absolute).hostname.toLowerCase();
    } catch {
      return;
    }

    for (const [key, domains] of Object.entries(SOCIAL_DOMAINS)) {
      if (found[key]) continue; // keep first found link

      const matches = domains.some((domain) => {
        return hostname === domain || hostname.endsWith(`.${domain}`);
      });

      if (matches) {
        found[key] = absolute;
      }
    }
  });

  return found;
}


module.exports = {
  fetchCompanyLogo
};