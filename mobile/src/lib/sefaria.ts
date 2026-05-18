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
  anchor?: string;
  anchorRef?: string;
  anchorRefExpanded?: string[];
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
  'mitzvot': 'מצווות',
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
  let text = Array.isArray(input) ? input.join(' ') : String(input);
  text = text.replace(/<i>([^<]+)<\/i>/g, (match, word) => {
    const cleanWord = word.replace(/[.,;?!]$/, '').trim();
    const punctuation = word.slice(word.lastIndexOf(cleanWord) + cleanWord.length);
    const key = Object.keys(TRANSLITERATION_MAP).find(
      k => k.toLowerCase() === cleanWord.toLowerCase()
    );
    if (key) {
      return `${TRANSLITERATION_MAP[key]}${punctuation}`;
    }
    return match;
  });
  return text;
}

export function extractDivreiHamaschil(he: string | string[]): string {
  if (!he) return '';
  const textContent = Array.isArray(he) ? he.join(' ') : String(he);
  const boldMatch = textContent.match(/<(b|strong)>([\s\S]*?)<\/\1>/i);
  if (boldMatch && boldMatch.index !== undefined && boldMatch.index < 50) {
      const dh = boldMatch[2].replace(/<[^>]*>/g, '').trim();
      if (dh.length > 0 && dh.length < 200) {
          return dh;
      }
  }
  const cleanText = textContent.replace(/<[^>]*>/g, '').trim();
  const match = cleanText.match(/\.|–|:|וכו/);
  if (match && match.index !== undefined && match.index > 0) {
    if (match.index > 150) return '';
    const isVekul = cleanText.substring(match.index, match.index + 3) === 'וכו';
    const dh = cleanText.substring(0, match.index + (isVekul ? 3 : 0)).trim();
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

export function getHebrewBooksUrl(ref: string): string | null {
  const match = ref.match(/^(.*?)\s(\d+)([ab])$/);
  if (!match) return null;
  const tractateName = match[1].replace(/\s/g, '_');
  const dafNum = match[2];
  const side = match[3];
  const hbId = HB_TRACTATE_MAP[tractateName];
  if (!hbId) return null;
  const dafParam = side === 'b' ? `${dafNum}b` : dafNum;
  return `https://hebrewbooks.org/shas.aspx?mesechta=${hbId}&daf=${dafParam}`;
}
