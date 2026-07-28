import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Map a color token (e.g. "sky") to a set of Tailwind classes for a card surface. */
export const colorPalette = {
  sky:     { bg: "bg-sky-100/90", border: "border-sky-300", text: "text-sky-950", ring: "ring-sky-400", dot: "bg-sky-500" },
  emerald: { bg: "bg-emerald-100/90", border: "border-emerald-300", text: "text-emerald-950", ring: "ring-emerald-400", dot: "bg-emerald-500" },
  amber:   { bg: "bg-amber-100/90", border: "border-amber-300", text: "text-amber-950", ring: "ring-amber-400", dot: "bg-amber-500" },
  rose:    { bg: "bg-rose-100/90", border: "border-rose-300", text: "text-rose-950", ring: "ring-rose-400", dot: "bg-rose-500" },
  violet:  { bg: "bg-violet-100/90", border: "border-violet-300", text: "text-violet-950", ring: "ring-violet-400", dot: "bg-violet-500" },
  fuchsia: { bg: "bg-fuchsia-100/90", border: "border-fuchsia-300", text: "text-fuchsia-950", ring: "ring-fuchsia-400", dot: "bg-fuchsia-500" },
  teal:    { bg: "bg-teal-100/90", border: "border-teal-300", text: "text-teal-950", ring: "ring-teal-400", dot: "bg-teal-500" },
  orange:  { bg: "bg-orange-100/90", border: "border-orange-300", text: "text-orange-950", ring: "ring-orange-400", dot: "bg-orange-500" },
  slate:   { bg: "bg-slate-100/90", border: "border-slate-300", text: "text-slate-950", ring: "ring-slate-400", dot: "bg-slate-500" },
} as const;

export type ColorToken = keyof typeof colorPalette;

export function colorClasses(token: string | null | undefined): typeof colorPalette[ColorToken] {
  return colorPalette[(token as ColorToken)] ?? colorPalette.sky;
}

/** Format an ISO date string 'YYYY-MM-DD' or full datetime flexibly. */
export function formatDate(
  iso: string | null | undefined,
  langOrOpts?: "uz" | "ru" | Intl.DateTimeFormatOptions,
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;

  let lang: "uz" | "ru" = "uz";
  let formatOptions: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };

  if (typeof langOrOpts === "string") {
    lang = langOrOpts;
    if (opts) formatOptions = opts;
  } else if (typeof langOrOpts === "object" && langOrOpts !== null) {
    formatOptions = langOrOpts;
  }

  const locale = lang === "ru" ? "ru-RU" : "uz-UZ";
  return d.toLocaleDateString(locale, formatOptions);
}

/** Format an ISO datetime to 24-hour HH:MM standard format. */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** YYYY-MM-DD for a given Date in local time. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Build a local-time ISO datetime 'YYYY-MM-DDTHH:MM:00' for a given date + minutes-from-midnight. */
export function localDateTime(date: string, minutesFromMidnight: number): string {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  return `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}

/** Minutes-from-midnight of a local datetime ISO string. */
export function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

/** Format currency in UZS for Uzbek and Russian locales. */
export function formatCurrency(amount: number | null | undefined, lang: "uz" | "ru" = "uz"): string {
  if (amount == null || Number.isNaN(amount)) {
    return lang === "ru" ? "0 сум" : "0 so'm";
  }
  const formatted = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(amount);
  return lang === "ru" ? `${formatted} сум` : `${formatted} so'm`;
}
