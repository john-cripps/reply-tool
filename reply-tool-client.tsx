"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";

type UsageBundle = {
  ok: boolean;
  plan: string;
  usage: { drafts: number; sends: number; yearMonth: string };
  limits: { drafts: number; sends: number };
  error?: string;
};

type ScriptResp<T> = {
  ok: boolean;
  data?: T;
  code?: number;
  plan?: string;
  usage?: UsageBundle["usage"];
  limits?: UsageBundle["limits"];
  error?: string;
};

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export default function ToolPage() {
  const { user, isLoaded } = useUser();

  const userId = useMemo(() => {
    // Clerk user.id is a stable unique identifier (NOT an email)
    return user?.id ?? "";
  }, [user]);

  const [labels, setLabels] = useState<string[]>([]);
  const [label, setLabel] = useState<string>("");
  const [loadingLabels, setLoadingLabels] = useState(false);

  const [usage, setUsage] = useState<UsageBundle | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);

  const [draftsResp, setDraftsResp] = useState<ScriptResp<any[]> | null>(null);
  const [runningDrafts, setRunningDrafts] = useState(false);

  const draftsRemaining = useMemo(() => {
    if (!usage) return null;
    return Math.max(0, usage.limits.drafts - usage.usage.drafts);
  }, [usage]);

  const sendsRemaining = useMemo(() => {
    if (!usage) return null;
    return Math.max(0, usage.limits.sends - usage.usage.sends);
  }, [usage]);

  const hitDraftLimit = useMemo(() => {
    if (!usage) return false;
    return usage.usage.drafts >= usage.limits.drafts;
  }, [usage]);

  const hitSendLimit = useMemo(() => {
    if (!usage) return false;
    return usage.usage.sends >= usage.limits.sends;
  }, [usage]);

  async function refreshUsage() {
    if (!userId) return;
    setLoadingUsage(true);
    try {
      const res = await postJSON<UsageBundle>("/api/usage", { userId });
      setUsage(res);
    } finally {
      setLoadingUsage(false);
    }
  }

  async function loadLabels() {
    if (!userId) return;
    setLoadingLabels(true);
    try {
      const res = await postJSON<ScriptResp<string[]>>("/api/script", {
        userId,
        action: "listLabels",
        payload: {},
      });
      const list = res.data ?? [];
      setLabels(list);
      // default pick something sensible if none selected
      if (!label && list.length) setLabel(list[0]);
    } finally {
      setLoadingLabels(false);
    }
  }

  async function runGenerateDrafts() {
    if (!userId) return;
    setRunningDrafts(true);
    setDraftsResp(null);
    try {
      const res = await postJSON<ScriptResp<any[]>>("/api/script", {
        userId,
        action: "generateDrafts",
        payload: {
          // IMPORTANT: your Apps Script may or may not use these fields.
          // If your GAS expects labelId instead of labelName, we’ll adjust.
          labelName: label,
        },
      });
      setDraftsResp(res);
      // refresh usage after action (drafts count should bump)
      await refreshUsage();
    } finally {
      setRunningDrafts(false);
    }
  }

  // boot
  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) return;
    refreshUsage();
    loadLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, userId]);

  if (!isLoaded) return <div className="container page">Loading…</div>;
  if (!userId) return <div className="container page">Please sign in.</div>;

  return (
    <div className="container page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <h1 className="h1" style={{ marginBottom: 6 }}>Reply Tool</h1>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            {loadingUsage ? "Loading usage…" : usage?.ok ? (
              <>
                Drafts: <b>{usage.usage.drafts}</b> / {usage.limits.drafts}{" "}
                • Sends: <b>{usage.usage.sends}</b> / {usage.limits.sends}{" "}
                • Plan: <b>{usage.plan}</b>
              </>
            ) : (
              <span style={{ color: "#ffb4b4" }}>Usage error: {usage?.error}</span>
            )}
          </div>
        </div>

        <button className="btn" onClick={refreshUsage} disabled={loadingUsage}>
          Refresh
        </button>
      </div>

      <div className="card" style={{ marginTop: 18 }}>
        <div className="cardTitle">Inbox Source</div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
          <div style={{ minWidth: 260 }}>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Label</div>
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={loadingLabels || labels.length === 0}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "white",
              }}
            >
              {labels.map((l) => (
                <option key={l} value={l} style={{ color: "black" }}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <button className="btn" onClick={loadLabels} disabled={loadingLabels}>
            {loadingLabels ? "Loading…" : "Reload labels"}
          </button>

          <div style={{ marginLeft: "auto", fontSize: 12, opacity: 0.85 }}>
            Drafts left: <b>{draftsRemaining ?? "—"}</b> • Sends left: <b>{sendsRemaining ?? "—"}</b>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="cardTitle">Generate Draft Replies</div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
          <button
            className="btn"
            onClick={runGenerateDrafts}
            disabled={runningDrafts || hitDraftLimit}
          >
            {runningDrafts ? "Generating…" : "Generate Drafts"}
          </button>

          {hitDraftLimit && (
            <div className="paywall" style={{ display: "block" }}>
              Draft limit reached. Upgrade to keep generating.
            </div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          {draftsResp?.ok && (
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              Result: <b>{draftsResp.data?.length ?? 0}</b> drafts created.
            </div>
          )}

          {!draftsResp?.ok && draftsResp?.error && (
            <div className="paywall" style={{ display: "block" }}>
              Error: {draftsResp.error}
            </div>
          )}
        </div>

        {draftsResp?.ok && (
          <pre style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.08)",
            overflowX: "auto",
            fontSize: 12
          }}>
            {JSON.stringify(draftsResp, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
