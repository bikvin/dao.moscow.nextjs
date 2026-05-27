export const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** "19 мая 2026" */
export function fmtLong(date: Date): string {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

/** "19.05.2026" */
export function fmtShort(date: Date): string {
  return new Date(date).toLocaleDateString("ru-RU");
}

/** Format kopecks as "1 234,56" */
export function num(kopecks: number): string {
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(kopecks / 100);
}

// ── Amount in words helpers ───────────────────────────────────────────────────

const H  = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];
const T  = ["","десять","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
const TN = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
const OM = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять"];
const OF = ["","одна","две","три","четыре","пять","шесть","семь","восемь","девять"];

export function pl(n: number, one: string, few: string, many: string): string {
  const m100 = Math.abs(n) % 100;
  const m10  = Math.abs(n) % 10;
  if (m100 >= 11 && m100 <= 19) return many;
  if (m10 === 1) return one;
  if (m10 >= 2 && m10 <= 4) return few;
  return many;
}

function tri(n: number, fem: boolean): string {
  const parts: string[] = [];
  const h = Math.floor(n / 100);
  const rem = n % 100;
  if (h) parts.push(H[h]);
  if (rem >= 10 && rem <= 19) {
    parts.push(TN[rem - 10]);
  } else {
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (t) parts.push(T[t]);
    if (o) parts.push(fem ? OF[o] : OM[o]);
  }
  return parts.join(" ");
}

/** Convert kopecks to Russian words, e.g. "Двести рублей 00 копеек" */
export function amountInWords(kopecks: number): string {
  const rub = Math.floor(kopecks / 100);
  const kop = kopecks % 100;
  const parts: string[] = [];
  const mil = Math.floor(rub / 1_000_000);
  if (mil) { parts.push(tri(mil, false)); parts.push(pl(mil, "миллион", "миллиона", "миллионов")); }
  const th = Math.floor((rub % 1_000_000) / 1_000);
  if (th) { parts.push(tri(th, true)); parts.push(pl(th, "тысяча", "тысячи", "тысяч")); }
  const rem = rub % 1_000;
  if (rem) parts.push(tri(rem, false));
  if (!parts.length) parts.push("ноль");
  const w = `${parts.join(" ")} ${pl(rub, "рубль", "рубля", "рублей")} ${kop.toString().padStart(2, "0")} ${pl(kop, "копейка", "копейки", "копеек")}`;
  return w.charAt(0).toUpperCase() + w.slice(1);
}
