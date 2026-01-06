export const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

type GtagFn = (...args: any[]) => void;

const getGtag = (): GtagFn | null => {
  if (typeof window === "undefined") return null;
  const gtag = (window as any).gtag as GtagFn | undefined;
  return typeof gtag === "function" ? gtag : null;
};

export const pageview = (url: string) => {
  if (!GA_ID) return;
  const gtag = getGtag();
  if (!gtag) return; // ✅ GA ще не завантажився / нема згоди — нічого не робимо
  gtag("config", GA_ID, { page_path: url });
};

export const gaEvent = (action: string, params?: Record<string, any>) => {
  if (!GA_ID) return;
  const gtag = getGtag();
  if (!gtag) return;
  gtag("event", action, params ?? {});
};

export const trackSearch = (params: {
  city?: string;
  type?: string;
  flowerName?: string;
  color?: string;
}) => {
  const term = `${params.flowerName ?? ""} ${params.color ?? ""}`.trim();

  gaEvent("search", {
    search_term: term || "(empty)",
    city: params.city || "any",
    type: params.type || "any",
  });
};
export const trackOrderStart = (flower: {
  id: number | string;
  name?: string;
  city?: string;
  price?: number;
  stock?: number;
  is_sale?: boolean;
}) => {
  gaEvent("order_start", {
    flower_id: flower.id,
    flower_name: flower.name ?? "",
    city: flower.city ?? "",
    price: flower.price ?? null,
    stock: flower.stock ?? null,
    is_sale: !!flower.is_sale,
  });
};
