import axios from 'axios';

export interface SefariaTextResponse {
  ref: string;
  he: string[];
  text: string[]; // English translation
  commentary?: SefariaCommentary[];
}

export interface SefariaCommentary {
  ref: string;
  he: string;
  text: string;
  index_title: string;
  collectiveTitle?: string | { en: string; he: string };
  category: string;
  author?: string;
  compDate?: [number, number];
  commentaryNum?: number;
  anchor?: string; // Legacy property if any
  anchorRef?: string; // The primary segment reference this commentary points to
  anchorRefExpanded?: string[]; // All segments this commentary covers
}

const TRANSLITERATION_MAP: Record<string, string> = {
  'Shema': 'שמע',
  'Mishna': 'משנה',
  'Mishnah': 'משנה',
  'Gemara': 'גמרא',
  'teruma': 'תרומה',
  'terumah': 'תרומה',
  'halakha': 'הלכה',
  'halakhah': 'הלכה',
  'mitzvah': 'מצווה',
  'mitzvot': 'מצוות',
  'Berakhot': 'ברכות',
  'tanna': 'תנא',
  'baraita': 'ברייתא',
  'beshokhbekha': 'בשכבך',
  'Amora’im': 'אמוראים',
  'Tanna’im': 'תנאים',
  'tefillin': 'תפילין',
  'tzitzit': 'ציצית',
  'mezuzah': 'מזוזה',
  'shabbat': 'שבת',
  'beit midrash': 'בית מדרש',
};

export function deTransliterate(input: string | string[]): string {
  if (!input) return '';
  
  // If input is an array, join it into a single string (common in Sefaria data)
  let text = Array.isArray(input) ? input.join(' ') : String(input);
  
  // Replace words in <i> tags if they are in our map
  text = text.replace(/<i>([^<]+)<\/i>/g, (match, word) => {
    // Clean the word of trailing punctuation for lookup
    const cleanWord = word.replace(/[.,;?!]$/, '').trim();
    const punctuation = word.slice(word.lastIndexOf(cleanWord) + cleanWord.length);
    
    // Case-insensitive lookup
    const key = Object.keys(TRANSLITERATION_MAP).find(
      k => k.toLowerCase() === cleanWord.toLowerCase()
    );
    
    if (key) {
      return `<span dir="rtl" class="font-serif text-amber-800">${TRANSLITERATION_MAP[key]}</span>${punctuation}`;
    }
    return match;
  });
  
  return text;
}

export function extractDivreiHamaschil(he: string | string[]): string {
  if (!he) return '';

  // Sefaria text can be a string or an array of strings
  const textContent = Array.isArray(he) ? he.join(' ') : String(he);

  // 1. STRATEGY: Look for bold tags first (very common for DH in Sefaria)
  // We look for <b>...</b> or <strong>...</strong>
  const boldMatch = textContent.match(/<(b|strong)>([\s\S]*?)<\/\1>/i);
  if (boldMatch && boldMatch.index !== undefined && boldMatch.index < 50) {
      const dh = boldMatch[2].replace(/<[^>]*>/g, '').trim();
      if (dh.length > 0 && dh.length < 200) {
          return dh;
      }
  }

  // 2. STRATEGY: Look for common separators (dot, dash, colon, etc.)
  // Remove HTML tags first to analyze text content for punctuation
  const cleanText = textContent.replace(/<[^>]*>/g, '').trim();
  const match = cleanText.match(/\.|–|:|וכו/);

  if (match && match.index !== undefined && match.index > 0) {
    // CRITICAL: If the delimiter is too far in (e.g. > 150 chars), it's probably not a DH
    if (match.index > 150) return '';

    const isVekul = cleanText.substring(match.index, match.index + 3) === 'וכו';
    const dh = cleanText.substring(0, match.index + (isVekul ? 3 : 0)).trim();

    // One last check: if the extracted DH is more than 70% of the whole text, 
    // it's likely just a short commentary without a DH
    if (dh.length > cleanText.length * 0.7) return '';

    return dh;
  }

  return '';
}

export async function getTalmudText(ref: string): Promise<SefariaTextResponse> {
  const response = await axios.get(`https://www.sefaria.org/api/texts/${ref}?commentary=1&context=1`);
  return response.data;
}

const HB_TRACTATE_MAP: Record<string, number> = {
  'Berakhot': 1, 'Shabbat': 2, 'Eruvin': 3, 'Pesachim': 4, 'Shekalim': 5, 'Yoma': 6, 'Sukkah': 7, 'Beitzah': 8, 'Rosh_Hashanah': 9, 'Taanit': 10, 'Megillah': 11, 'Moed_Katan': 12, 'Chagigah': 13, 'Yevamot': 14, 'Ketubot': 15, 'Nedarim': 16, 'Nazir': 17, 'Sotah': 18, 'Gittin': 19, 'Kiddushin': 20, 'Bava_Kamma': 21, 'Bava_Metzia': 22, 'Bava_Batra': 23, 'Sanhedrin': 24, 'Makkot': 25, 'Shevuot': 26, 'Avodah_Zarah': 27, 'Horayot': 28, 'Zevachim': 29, 'Menachot': 30, 'Chullin': 31, 'Bekhorot': 32, 'Arakhin': 33, 'Temurah': 34, 'Keritot': 35, 'Meilah': 36, 'Tamid': 37, 'Middot': 38, 'Kinnim': 39, 'Niddah': 40
};

export const TRACTATE_MAX_DAF: Record<string, number> = {
  'Berakhot': 64, 'Shabbat': 157, 'Eruvin': 105, 'Pesachim': 121, 'Shekalim': 22, 'Yoma': 88, 'Sukkah': 56, 'Beitzah': 40, 'Rosh Hashanah': 35, 'Taanit': 31, 'Megillah': 32, 'Moed Katan': 29, 'Chagigah': 27, 'Yevamot': 122, 'Ketubot': 112, 'Nedarim': 91, 'Nazir': 66, 'Sotah': 49, 'Gittin': 90, 'Kiddushin': 82, 'Bava Kamma': 119, 'Bava Metzia': 119, 'Bava Batra': 176, 'Sanhedrin': 113, 'Makkot': 24, 'Shevuot': 49, 'Avodah Zarah': 76, 'Horayot': 14, 'Zevachim': 120, 'Menachot': 110, 'Chullin': 142, 'Bekhorot': 61, 'Arakhin': 34, 'Temurah': 34, 'Keritot': 28, 'Meilah': 22, 'Tamid': 33, 'Niddah': 73
};

export function isValidRef(ref: string): boolean {
  const match = ref.match(/^(.*?)\s(\d+)([ab])$/);
  if (!match) return false;

  const tractate = match[1];
  const daf = parseInt(match[2]);
  
  const maxDaf = TRACTATE_MAX_DAF[tractate];
  if (!maxDaf) return true; // Allow if we don't have metadata yet

  return daf >= 2 && daf <= maxDaf;
}

export function getHebrewBooksUrl(ref: string): string | null {
  // Expected format: "Tractate 2a"
  const match = ref.match(/^(.*?)\s(\d+)([ab])$/);
  if (!match) return null;

  const tractateName = match[1].replace(/\s/g, '_');
  const dafNum = match[2];
  const side = match[3];
  
  const hbId = HB_TRACTATE_MAP[tractateName];
  if (!hbId) return null;

  // HebrewBooks format: daf=2 for 2a, daf=2b for 2b. No ammud parameter.
  const dafParam = side === 'b' ? `${dafNum}b` : dafNum;

  return `https://hebrewbooks.org/shas.aspx?mesechta=${hbId}&daf=${dafParam}`;
}
