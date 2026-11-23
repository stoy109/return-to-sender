import type { Lang, T } from "../i18n.tsx";

export function formatRelative(from: number, now: number, lang: Lang, t: T): string {
  const sec = Math.max(0, Math.floor((now - from) / 1000));
  if (sec < 45) return t("time.just");
  const min = Math.floor(sec / 60);
  if (min < 60) return min <= 1 ? t("time.min1") : t("time.min", { n: String(min) });
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr <= 1 ? t("time.hr1") : t("time.hr", { n: String(hr) });
  const day = Math.floor(hr / 24);
  if (day === 1) return t("time.yesterday");
  if (day < 7) return t("time.days", { n: String(day) });
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(from));
}

export function snippet(text: string, length = 60): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= length) return flat;
  return `${flat.slice(0, length - 1).trimEnd()}…`;
}
