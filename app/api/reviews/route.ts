import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  return NextResponse.json({ ok: true, message: "reviews endpoint is alive (POST only)" });
}

export async function POST(req: Request) {
  try {
    // ✅ створюємо клієнт тільки під час реального запиту
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing Supabase env" },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { token, rating, comment } = await req.json();

    if (!token || typeof rating !== "number") {
      return NextResponse.json(
        { error: "Missing token/rating" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be 1..5" },
        { status: 400 }
      );
    }

    // 1) знайти замовлення по токену
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id, shop_id, status")
      .eq("review_token", token)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
    }

    // 2) дозволяємо відгук тільки після завершення
    if (order.status !== "done") {
      return NextResponse.json(
        { error: "Order is not done" },
        { status: 400 }
      );
    }

    // 3) вставляємо відгук
    const cleanedComment =
      typeof comment === "string" && comment.trim() ? comment.trim() : null;

    const { error: insErr } = await supabaseAdmin.from("reviews").insert({
      order_id: order.id,
      shop_id: order.shop_id,
      rating,
      comment: cleanedComment,
    });

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Bad request", details: e?.message ?? null },
      { status: 400 }
    );
  }
}
