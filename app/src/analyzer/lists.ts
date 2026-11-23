/**
 * Domains this demo treats as already-known bad.
 * They are fictional fixtures for the class, not a live threat feed.
 */
export const KNOWN_BAD_DOMAINS: readonly string[] = [
  "bca-secure-login.xyz",
  "verifikasi-bri.top",
  "mandiri-update.click",
  "shopee-hadiah.gq",
  "ojk-konfirmasi.buzz",
  "paket-jne-resmi.tk",
  "bri-mobile-aman.xyz",
];

/** Hosts that hide the real destination. `ly` alone is not enough; the host is. */
export const SHORTENERS: readonly string[] = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "tiny.cc",
  "s.id",
  "bit.do",
  "rebrand.ly",
  "t.ly",
  "lnkd.in",
  "db.tt",
  "adf.ly",
  "bc.vc",
  "v.gd",
  "tiny.one",
  "short.io",
  "gg.gg",
];

/**
 * Public suffixes that are often abused and unusual for Indonesian banks,
 * couriers, and shops. Ordinary suffixes such as com, id, and co.id are absent.
 */
export const UNUSUAL_TLDS: readonly string[] = [
  "xyz",
  "top",
  "click",
  "gq",
  "tk",
  "ml",
  "ga",
  "cf",
  "buzz",
  "rest",
  "loan",
  "work",
  "kim",
  "country",
  "men",
  "bid",
  "download",
  "racing",
  "win",
  "review",
  "date",
  "stream",
  "vip",
  "icu",
  "monster",
  "sbs",
  "cfd",
  "cyou",
  "quest",
  "zip",
  "mov",
];

/** Second-level suffixes where the registrable name is three labels deep. */
export const MULTI_SUFFIXES: readonly string[] = [
  "co.id",
  "go.id",
  "ac.id",
  "or.id",
  "web.id",
  "my.id",
  "sch.id",
  "mil.id",
  "net.id",
];

export interface ProtectedDomain {
  /** Registrable domain students should compare against. */
  domain: string;
  /** Labels that count as that organisation, shortest names included. */
  labels: readonly string[];
}

/**
 * Common Indonesian bank, wallet, shop, courier, and agency domains.
 * A hit means "this string imitates that site", not "we visited it".
 */
export const PROTECTED_DOMAINS: readonly ProtectedDomain[] = [
  { domain: "bca.co.id", labels: ["bca"] },
  { domain: "bri.co.id", labels: ["bri"] },
  { domain: "bni.co.id", labels: ["bni"] },
  { domain: "btn.co.id", labels: ["btn"] },
  { domain: "bankmandiri.co.id", labels: ["bankmandiri", "mandiri"] },
  { domain: "cimbniaga.co.id", labels: ["cimbniaga", "cimb"] },
  { domain: "bankbsi.co.id", labels: ["bankbsi", "bsi"] },
  { domain: "permatabank.com", labels: ["permatabank", "permata"] },
  { domain: "jenius.com", labels: ["jenius"] },
  { domain: "tokopedia.com", labels: ["tokopedia"] },
  { domain: "shopee.co.id", labels: ["shopee"] },
  { domain: "bukalapak.com", labels: ["bukalapak"] },
  { domain: "blibli.com", labels: ["blibli"] },
  { domain: "lazada.co.id", labels: ["lazada"] },
  { domain: "gojek.com", labels: ["gojek"] },
  { domain: "grab.com", labels: ["grab"] },
  { domain: "dana.id", labels: ["dana"] },
  { domain: "ovo.id", labels: ["ovo"] },
  { domain: "linkaja.id", labels: ["linkaja"] },
  { domain: "jne.co.id", labels: ["jne"] },
  { domain: "jet.co.id", labels: ["jet", "jnt"] },
  { domain: "sicepat.com", labels: ["sicepat"] },
  { domain: "posindonesia.co.id", labels: ["posindonesia"] },
  { domain: "ojk.go.id", labels: ["ojk"] },
  { domain: "pajak.go.id", labels: ["pajak"] },
  { domain: "komdigi.go.id", labels: ["komdigi"] },
  { domain: "kominfo.go.id", labels: ["kominfo"] },
  { domain: "pln.co.id", labels: ["pln"] },
  { domain: "telkomsel.com", labels: ["telkomsel"] },
  { domain: "xl.co.id", labels: ["xl"] },
];
