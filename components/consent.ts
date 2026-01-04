const KEY = "cookie_consent";

export const getConsent = (): "accepted" | "rejected" | null => {
  if (typeof window === "undefined") return null;

  // 1) cookie
  const m = document.cookie.match(new RegExp(`(?:^|; )${KEY}=([^;]*)`));
  if (m) {
    const v = decodeURIComponent(m[1]);
    if (v === "accepted" || v === "rejected") return v;
  }

  // 2) localStorage fallback
  const ls = localStorage.getItem(KEY);
  if (ls === "accepted" || ls === "rejected") return ls;

  return null;
};

export const setConsent = (value: "accepted" | "rejected") => {
  if (typeof window === "undefined") return;

  // localStorage
  localStorage.setItem(KEY, value);

  // cookie (стабільно для браузерів)
  const isKvity = window.location.hostname.endsWith("kvity.info");
  const domain = isKvity ? "Domain=.kvity.info; " : "";
  document.cookie = `${KEY}=${encodeURIComponent(value)}; ${domain}Path=/; Max-Age=31536000; SameSite=Lax`;
};