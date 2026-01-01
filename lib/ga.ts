export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const pageview = (url: string) => {
  if (!GA_ID || typeof window === "undefined") return;
  window.gtag("config", GA_ID, { page_path: url });
};

export const gaEvent = (action: string, params?: Record<string, any>) => {
  if (!GA_ID || typeof window === "undefined") return;
  window.gtag("event", action, params ?? {});
};
