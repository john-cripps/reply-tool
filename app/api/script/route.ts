// app/api/script/route.ts
import { NextResponse } from "next/server";
import { bumpUsage, getUsageBundle } from "@/src/lib/usage";

const SCRIPT_URL = process.env.APPS_SCRIPT_URL;

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function POST(req: Request) {
  if (!SCRIPT_URL) {
    return jsonError("Missing APPS_SCRIPT_URL in .env.local", 500);
  }

  // 1) Parse request body
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const userId: string | undefined = body?.userId;
  const action: string | undefined = body?.action;
  const payload: any = body?.payload ?? {};

  if (!userId) return jsonError("Missing userId", 401);
  if (!action) return jsonError("Missing action", 400);

  // 2) Fetch usage + limits and enforce BEFORE calling Apps Script
  const usageInfo = await getUsageBundle(userId);
  const { plan, usage, limits } = usageInfo;

  // If you want some actions to ignore limits, whitelist them here:
  const UNLIMITED_ACTIONS = new Set(["listLabels", "getUserSettings", "getRunLog"]);

  if (!UNLIMITED_ACTIONS.has(action)) {
    if (action === "generateDrafts" && usage.drafts >= limits.drafts) {
      return NextResponse.json(
        {
          ok: false,
          code: "LIMIT_REACHED",
          message: "Draft limit reached",
          plan,
          usage,
          limits,
        },
        { status: 402 }
      );
    }

    if (action === "sendDraft" && usage.sends >= limits.sends) {
      return NextResponse.json(
        {
          ok: false,
          code: "LIMIT_REACHED",
          message: "Send limit reached",
          plan,
          usage,
          limits,
        },
        { status: 402 }
      );
    }
  }

  // 3) Proxy call to Apps Script
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  const text = await res.text();

  // If Apps Script returns non-2xx, pass through (don’t count usage)
  if (!res.ok) {
    // Try to return JSON if it is JSON, otherwise return text
    try {
      const parsedErr = JSON.parse(text);
      return NextResponse.json(parsedErr, { status: res.status });
    } catch {
      return new NextResponse(text, { status: res.status });
    }
  }

  // 4) Parse Apps Script JSON (or pass through raw)
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Apps Script returned HTML/text despite 200 — just return it
    return new NextResponse(text, { status: 200 });
  }

  // 5) If Apps Script succeeded, bump usage counters
  // We only bump when Apps Script reports ok:true
  if (parsed?.ok) {
    if (action === "generateDrafts") {
      // If your Apps Script returns drafted items as an array in parsed.data
      const draftedCount = Array.isArray(parsed?.data) ? parsed.data.length : 0;
      if (draftedCount > 0) await bumpUsage(userId, "drafts", draftedCount);
    }

    if (action === "sendDraft") {
      await bumpUsage(userId, "sends", 1);
    }
  }

  // 6) Return Apps Script result + fresh usage bundle for UI bars
  const fresh = await getUsageBundle(userId);

  return NextResponse.json(
    {
      ...parsed,
      plan: fresh.plan,
      usage: fresh.usage,
      limits: fresh.limits,
    },
    { status: 200 }
  );
}
