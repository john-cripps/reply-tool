"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";

type UsageRes = {
  ok: boolean;
  error?: string;
  plan?: "free" | "pro" | "team";
  usage?: { drafts: number; sends: number; yearMonth: string };
  limits?: { drafts: number; sends: number };
};

export default function DashboardPage() {
  const { userId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UsageRes | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });

        const json = (await res.json()) as UsageRes;
        if (!cancelled) setData(json);
      } catch (e: any) {
        if (!cancelled) setData({ ok: false, error: e?.message || "Fetch failed" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const drafts = data?.usage?.drafts ?? 0;
  const sends = data?.usage?.sends ?? 0;
  const draftLimit = data?.limits?.drafts ?? 0;
  const sendLimit = data?.limits?.sends ?? 0;

  const draftPct = useMemo(() => {
    if (!draftLimit) return 0;
    return Math.min(100, Math.round((drafts / draftLimit) * 100));
  }, [drafts, draftLimit]);

  const sendPct = useMemo(() => {
    if (!sendLimit) return 0;
    return Math.min(100, Math.round((sends / sendLimit) * 100));
  }, [sends, sendLimit]);

  const hitLimit =
    (!!draftLimit && drafts >= draftLimit) || (!!sendLimit && sends >= sendLimit);

  return (
    <>
      <div className="container topbarWrap">
        <div className="topbar">
          <div className="brand">
            <img
              src="https://beehiiv-images-production.s3.amazonaws.com/uploads/asset/file/f207f2ca-484e-4ed1-ab91-b8769debdaa7/Screenshot_2026-01-17_at_3.35.???.png"
              alt="Main Street AI"
            />
            <div className="brandName">Main Street AI</div>
          </div>

          <div className="navRight">
            <Link className="btn" href="/">
              Home
            </Link>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      <main className="container page">
        <section className="heroCard heroCardTall">
          <div className="heroTopRow">
            <div>
              <h1 className="h1">Dashboard</h1>
              <p className="sub">
                {loading ? "Loading your workspace…" : "Ready."}{" "}
                {!loading && !data?.ok ? `(${data?.error || "error"})` : ""}
              </p>
            </div>
          </div>

          <div className="heroGrid">
            <Link href="/tool" className="heroBox">
              <div className="heroBoxTitle">Open Reply Tool</div>
              <div className="heroBoxSub">Generate drafts, label, and send.</div>
              <div className="heroBoxCta">Open →</div>
            </Link>

            <a className="heroBox" href="mailto:user_support@msa-mail.com">
              <div className="heroBoxTitle">Got questions?</div>
              <div className="heroBoxSub">Talk to our support team:</div>
              <div className="heroBoxCta">user_support@msa-mail.com</div>
            </a>

            <Link href="/pricing" className="heroBox heroBoxPro">
              <div className="heroBoxTitle">Go Pro</div>
              <div className="heroBoxSub">Higher limits + faster workflow.</div>
              <div className="heroBoxCta">Upgrade →</div>
            </Link>
          </div>
        </section>

        <div className="card cardSpaced">
          <div className="cardTitle">Usage</div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <span>Drafts</span>
            <span>
              {drafts} / {draftLimit}
            </span>
          </div>
          <div className="bar">
            <div className="barFill" style={{ width: `${draftPct}%` }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <span>Sends</span>
            <span>
              {sends} / {sendLimit}
            </span>
          </div>
          <div className="bar">
            <div className="barFill" style={{ width: `${sendPct}%` }} />
          </div>

          {hitLimit && (
            <div style={{ marginTop: 12 }} className="paywall">
              You’ve hit your limit. Upgrade to keep going.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
