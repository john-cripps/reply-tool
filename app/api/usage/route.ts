// app/api/usage/route.ts
import { NextResponse } from "next/server";
import { getUsage } from "@/src/lib/usage";
import { getPlanForUser, LIMITS } from "@/src/lib/plan";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Missing userId" }, { status: 400 });
    }

    const plan = getPlanForUser(userId);
    const usage = await getUsage(userId);

    return NextResponse.json({
      ok: true,
      plan,
      usage,
      limits: LIMITS[plan],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
