import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("flowers")
    .select("id, name, shop_id, city, photo")
    .limit(5);

  return new Response(
    JSON.stringify({
      env: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + "...",
      },
      data,
      error,
    }),
    { status: 200 }
  );
}

