import type { ReportChannel, SenderKind, Verdict } from "./types.ts";

export interface SampleSeed {
  kind: SenderKind;
  raw: string;
  channels: ReportChannel[];
  note: string;
  daysAgo: number;
}

export interface Sample {
  id: "package" | "bank" | "safe" | "border" | "email" | "prize-email" | "repeat";
  /** i18n key for the short label in the example menu. */
  labelKey: string;
  expectedVerdict: Verdict;
  /** Rule-engine score before any saved-sender bonus. */
  expectedScore: number;
  text: string;
  /** Fictional prior report inserted into the local list when this example is opened. */
  seed?: SampleSeed;
  /** Check immediately so the repeat banner is on screen after one click. */
  autoCheck?: boolean;
}

/** Class demo messages. The package text is the one "Try an example" leads with. */
export const SAMPLES: readonly Sample[] = [
  {
    id: "package",
    labelKey: "sample.package",
    expectedVerdict: "likely_scam",
    expectedScore: 74,
    text: "[JNE] Paket Anda tertahan di gudang sortir karena alamat tidak lengkap. Segera konfirmasi dalam 2 jam atau paket akan dikembalikan. Hubungi 0812-3456-7890. Bayar ongkir Rp18.500 di bit.ly/jne-cek-paket",
  },
  {
    id: "bank",
    labelKey: "sample.bank",
    expectedVerdict: "likely_scam",
    expectedScore: 100,
    text: "BCA: Kami mendeteksi login mencurigakan. Segera kirim kode OTP Anda ke chat ini agar akun tidak diblokir dalam 10 menit. Verifikasi di https://bca-aman.top/login atau transfer ke 539201847362",
  },
  {
    id: "safe",
    labelKey: "sample.safe",
    expectedVerdict: "safe",
    expectedScore: 0,
    text: "Hai Raka, catatan kuliah kemarin sudah aku kirim ke email kampus. Kita ketemu jam 7 di kantin ya.",
  },
  {
    id: "border",
    labelKey: "sample.border",
    expectedVerdict: "suspicious",
    expectedScore: 52,
    text: "Selamat! Anda terpilih mendapat hadiah voucher belanja. Konfirmasi hari ini sebelum hangus. Transfer biaya admin Rp25.000, detail di bit.ly/hadiah-promo",
  },
  {
    id: "email",
    labelKey: "sample.email",
    expectedVerdict: "likely_scam",
    expectedScore: 100,
    text: "From: keamanan-bca@gmail.com\n\nBCA: Kami mendeteksi login mencurigakan. Segera kirim kode OTP Anda agar akun tidak diblokir dalam 10 menit. Verifikasi di https://bca-aman.top/login",
  },
  {
    id: "prize-email",
    labelKey: "sample.prizeEmail",
    expectedVerdict: "suspicious",
    expectedScore: 52,
    text: "From: undian.resmi@outlook.com\n\nSelamat! Anda terpilih mendapat hadiah voucher belanja. Konfirmasi hari ini sebelum hangus. Transfer biaya admin Rp25.000, detail di bit.ly/hadiah-promo",
  },
  {
    id: "repeat",
    labelKey: "sample.repeat",
    expectedVerdict: "likely_scam",
    expectedScore: 74,
    autoCheck: true,
    seed: {
      kind: "phone",
      raw: "0812-3456-7890",
      channels: ["sms", "iasc"],
      note: "Fictional first report: a package-held SMS with a short link. Not a real sender.",
      daysAgo: 6,
    },
    text: "[JNE] Pengingat: Paket Anda tertahan. Segera bayar ongkir hari ini atau paket akan dikembalikan. Hubungi 0812-3456-7890. Cek bit.ly/jne-cek-paket",
  },
];
