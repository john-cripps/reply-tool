"use client";

import { useEffect, useMemo, useState } from "react";

type RunRow = {
  time: string;
  status: string;
  toEmail: string;
  subject: string;
  note?: string;
  draftId?: string;
  threadId?: string;
  messageId?: string;
  threadUrl?: string;
  draftUrl?: string;
  draftBody?: string;
};

type Settings = {
  BUSINESS_NAME: string;
  GMAIL_LABEL: string;
  DRAFTED_LABEL: string;
  SENT_LABEL: string;
  TONE: string;
  SIGN_OFF: string;
  MAX_EMAILS_PER_RUN: number;
  SAFE_MODE: boolean;
  BUSINESS_HOURS: string;
  TIMEZONE: string;
  LOCATION: string;
  SERVICES: string;
  BOOKING_LINK: string;
  POLICY_NOTES: string;
};

type UsageResp = {
  ok: boolean;
  plan: string;
  usage: { drafts: number; sends: number; yearMonth: string };
  limits: { drafts: number; sends: number };
};

type ScriptResp<T> = {
  ok: boolean;
  code?: number;
  error?: string;
  data?: T;
  // your api/script sometimes returns these too:
  plan?: string;
  usage?: UsageResp["usage"];
  limits?: UsageResp["limits"];
};

const DEFAULT_SETTINGS: Settings = {
  BUSINESS_NAME: "",
  GMAIL_LABEL: "AI-REPLY",
  DRAFTED_LABEL: "AI-DRAFTED",
  SENT_LABEL: "AI-SENT",
  TONE: "Professional, concise, helpful",
  SIGN_OFF: "—",
  MAX_EMAILS_PER_RUN: 10,
  SAFE_MODE: true,
  BUSINESS_HOURS: "",
  TIMEZONE: "America/Los_Angeles",
  LOCATION: "",
  SERVICES: "",
  BOOKING_LINK: "",
  POLICY_NOTES: "",
};

export default function ReplyToolClient({ userId }: { userId: string }) {
  // data
  const [labels, setLabels] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [rows, setRows] = useState<RunRow[]>([]);
  const [usage, setUsage] = useState<UsageResp | null>(null);

  // ui state
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<RunRow | null>(null);
  const [pvStatus, setPvStatus] = useState("");

  const overLimit = useMemo(() => {
    if (!usage) return false;
    return (
      usage.usage.drafts >= usage.limits.drafts ||
      usage.usage.sends >= usage.limits.sends
    );
  }, [usage]);

  // ----------- helpers -----------
  async function callScript<T>(action: string, payload: any = {}): Promise<ScriptResp<T>> {
    const res = await fetch("/api/script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, payload }),
    });

    const text = await res.text();
    // protect against accidental HTML responses
    if (text.trim().startsWith("<")) {
      return { ok: false, error: "Server returned HTML instead of JSON (check server logs)." };
    }

    const json = JSON.parse(text) as ScriptResp<T>;
    return json;
  }

  async function loadUsage() {
    const res = await fetch("/api/usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const json = (await res.json()) as UsageResp;
    setUsage(json);
  }

  function newestFirst(list: RunRow[]) {
    return (list || []).slice().sort((a, b) => {
      const ta = Date.parse(a?.time || "") || 0;
      const tb = Date.parse(b?.time || "") || 0;
      return tb - ta;
    });
  }

  function fmtTime(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  // ----------- load on mount -----------
  useEffect(() => {
    (async () => {
      try {
        setStatus("Loading…");

        await loadUsage();

        // 1) labels
        const lab = await callScript<string[]>("listLabels", {});
        if (!lab.ok) throw new Error(lab.error || "Failed to load labels");
        setLabels(Array.isArray(lab.data) ? lab.data : []);

        // 2) settings
        const s = await callScript<Settings>("getUserSettings", {});
        if (!s.ok) throw new Error(s.error || "Failed to load settings");
        setSettings({ ...DEFAULT_SETTINGS, ...(s.data as any) });

        // 3) run log
        const log = await callScript<RunRow[]>("getRunLog", {});
        if (!log.ok) throw new Error(log.error || "Failed to load run log");
        setRows(newestFirst(Array.isArray(log.data) ? log.data : []));

        setStatus("");
      } catch (e: any) {
        setStatus("Error: " + (e?.message || String(e)));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------- actions -----------
  async function saveSettings() {
    try {
      setBusy(true);
      setStatus("Saving…");

      const resp = await callScript("saveUserSettings", settings);
      if (!resp.ok) throw new Error(resp.error || "Save failed");

      setStatus("Saved ✅");
    } catch (e: any) {
      setStatus("Save failed: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function createDefaultLabel() {
    try {
      setBusy(true);
      setStatus("Creating AI-REPLY label…");
      const resp = await callScript("createWatchLabel", { labelName: "AI-REPLY" });
      if (!resp.ok) throw new Error(resp.error || "Create label failed");

      // refresh labels
      const lab = await callScript<string[]>("listLabels", {});
      if (lab.ok) setLabels(Array.isArray(lab.data) ? lab.data : []);

      setSettings((s) => ({ ...s, GMAIL_LABEL: "AI-REPLY" }));
      setStatus("AI-REPLY created ✅");
    } catch (e: any) {
      setStatus("Create label failed: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function loadRunLog() {
    const log = await callScript<RunRow[]>("getRunLog", {});
    if (log.ok) setRows(newestFirst(Array.isArray(log.data) ? log.data : []));
  }

  async function clearLog() {
    try {
      setBusy(true);
      setStatus("Clearing log…");
      const resp = await callScript("clearRunLog", {});
      if (!resp.ok) throw new Error(resp.error || "Clear failed");
      setRows([]);
      setSelected(null);
      setStatus("Log cleared ✅");
    } catch (e: any) {
      setStatus("Clear failed: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function runGenerate() {
    try {
      setBusy(true);
      setStatus("Generating drafts…");

      if (overLimit) {
        setStatus("You’ve hit your limit. Upgrade to keep using the tool.");
        return;
      }

      const resp = await callScript<RunRow[]>("generateDrafts", {});
      if (!resp.ok) throw new Error(resp.error || "Run failed");

      // keep usage in sync if api sends it
      if (resp.plan && resp.usage && resp.limits) {
        setUsage((u) =>
          u ? { ...u, plan: resp.plan!, usage: resp.usage!, limits: resp.limits! } : u
        );
      } else {
        await loadUsage();
      }

      await loadRunLog();
      setStatus("Done ✅");
    } catch (e: any) {
      setStatus("Run failed: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  async function sendDraftById(draftId: string) {
    try {
      setPvStatus("Sending…");
      setBusy(true);

      if (overLimit) {
        setPvStatus("You’ve hit your limit. Upgrade to keep sending.");
        return;
      }

      const resp = await callScript("sendDraft", { draftId });
      if (!resp.ok) throw new Error(resp.error || "Send failed");

      if (resp.plan && resp.usage && resp.limits) {
        setUsage((u) =>
          u ? { ...u, plan: resp.plan!, usage: resp.usage!, limits: resp.limits! } : u
        );
      } else {
        await loadUsage();
      }

      setPvStatus("Sent ✅");
      await loadRunLog();
    } catch (e: any) {
      setPvStatus("Send failed: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  }

  // usage bar fill by drafts
  const usagePct = useMemo(() => {
    if (!usage) return 0;
    return Math.min(100, Math.round((usage.usage.drafts / usage.limits.drafts) * 100));
  }, [usage]);

  // ----------- UI -----------
  return (
    <div className="msrApp">
      <header className="msrTopbar">
        <div>
          <div className="msrTitle">Main Street Reply</div>
          <div className="msrSub">
            Draft replies from labeled emails. Fast, safe, human-editable.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {usage && (
            <div className="msrUsagePill">
              <div className="msrUsageLine">
                Drafts <b>{usage.usage.drafts}</b>/{usage.limits.drafts} • Sends{" "}
                <b>{usage.usage.sends}</b>/{usage.limits.sends} • <b>{usage.plan}</b>
              </div>
              <div className="msrBar">
                <div className="msrBarFill" style={{ width: `${usagePct}%` }} />
              </div>
              {overLimit && <div className="msrPaywall">Limit reached — upgrade to continue.</div>}
            </div>
          )}
          <div className="msrPill">MVP</div>
        </div>
      </header>

      <main className="msrGrid">
        {/* SETTINGS */}
        <section className="msrCard">
          <h2>Settings</h2>

          <label>Business name</label>
          <input
            value={settings.BUSINESS_NAME}
            onChange={(e) => setSettings({ ...settings, BUSINESS_NAME: e.target.value })}
            placeholder="Acme Plumbing"
          />

          <label>Business hours</label>
          <input
            value={settings.BUSINESS_HOURS}
            onChange={(e) => setSettings({ ...settings, BUSINESS_HOURS: e.target.value })}
            placeholder="Mon–Fri 9am–5pm PST"
          />

          <label>Timezone</label>
          <input
            value={settings.TIMEZONE}
            onChange={(e) => setSettings({ ...settings, TIMEZONE: e.target.value })}
            placeholder="America/Los_Angeles"
          />

          <label>Location (optional)</label>
          <input
            value={settings.LOCATION}
            onChange={(e) => setSettings({ ...settings, LOCATION: e.target.value })}
            placeholder="Los Angeles, CA"
          />

          <label>Services (comma-separated)</label>
          <input
            value={settings.SERVICES}
            onChange={(e) => setSettings({ ...settings, SERVICES: e.target.value })}
            placeholder="Repairs, installs, emergency callouts"
          />

          <label>Booking link (optional)</label>
          <input
            value={settings.BOOKING_LINK}
            onChange={(e) => setSettings({ ...settings, BOOKING_LINK: e.target.value })}
            placeholder="https://calendly.com/..."
          />

          <label>Policy notes (optional)</label>
          <textarea
            value={settings.POLICY_NOTES}
            onChange={(e) => setSettings({ ...settings, POLICY_NOTES: e.target.value })}
            rows={3}
            placeholder="Cancellations require 24h notice..."
          />

          <label>Gmail label to watch</label>
          <select
            value={settings.GMAIL_LABEL}
            onChange={(e) => setSettings({ ...settings, GMAIL_LABEL: e.target.value })}
          >
            <option value="">(select a watch label…)</option>
            {labels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>

          <label>Label after draft created</label>
          <input
            value={settings.DRAFTED_LABEL}
            onChange={(e) => setSettings({ ...settings, DRAFTED_LABEL: e.target.value })}
            placeholder="AI-DRAFTED"
          />

          <label>Label after sent</label>
          <input
            value={settings.SENT_LABEL}
            onChange={(e) => setSettings({ ...settings, SENT_LABEL: e.target.value })}
            placeholder="AI-SENT"
          />

          <label>Tone</label>
          <select
            value={settings.TONE}
            onChange={(e) => setSettings({ ...settings, TONE: e.target.value })}
          >
            <option>Professional, concise, helpful</option>
            <option>Friendly, warm, helpful</option>
            <option>Direct, no-fluff, helpful</option>
          </select>

          <label>Sign-off</label>
          <input
            value={settings.SIGN_OFF}
            onChange={(e) => setSettings({ ...settings, SIGN_OFF: e.target.value })}
            placeholder="— John"
          />

          <label>Max emails per run</label>
          <input
            type="number"
            min={1}
            max={50}
            value={settings.MAX_EMAILS_PER_RUN}
            onChange={(e) =>
              setSettings({ ...settings, MAX_EMAILS_PER_RUN: Number(e.target.value || 10) })
            }
          />

          <label className="msrRow">
            <input
              type="checkbox"
              checked={settings.SAFE_MODE}
              onChange={(e) => setSettings({ ...settings, SAFE_MODE: e.target.checked })}
            />
            <span>Safe mode (skip refunds/legal/chargebacks)</span>
          </label>

          <div className="msrActions">
            <button className="msrBtn" disabled={busy} onClick={saveSettings}>
              Save
            </button>
            <button className="msrBtn msrBtnPrimary" disabled={busy || overLimit} onClick={runGenerate}>
              Generate Drafts
            </button>
          </div>

          <div className="msrHint">{status}</div>

          <div className="msrActions" style={{ marginTop: 10 }}>
            <button className="msrBtn msrBtnGhost" disabled={busy} onClick={createDefaultLabel}>
              + Create AI-REPLY label
            </button>
          </div>
        </section>

        {/* RESULTS */}
        <section className="msrCard">
          <div className="msrResultsHeader">
            <h2>Results</h2>
            <div className="msrResultsHint">
              Click a row to preview. Use Send to send the draft.
            </div>
          </div>

          <button className="msrBtn msrBtnGhost" disabled={busy} onClick={clearLog}>
            Clear log
          </button>

          <div className="msrTableWrap">
            <table className="msrTable">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Status</th>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Note</th>
                  <th style={{ width: 220 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="msrMuted">
                      No runs yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const canSend = r.status === "drafted" && r.draftId;
                    return (
                      <tr
                        key={idx}
                        className="msrRowClickable"
                        onClick={() => setSelected(r)}
                      >
                        <td>{fmtTime(r.time)}</td>
                        <td>{r.status}</td>
                        <td>{r.toEmail}</td>
                        <td>{r.subject}</td>
                        <td>{r.note || ""}</td>
                        <td>
                          <div className="msrRowActions" onClick={(e) => e.stopPropagation()}>
                            <button className="msrBtn msrBtnGhost msrBtnSm" onClick={() => setSelected(r)}>
                              Preview
                            </button>
                            {r.threadUrl && (
                              <a className="msrLinkPill" href={r.threadUrl} target="_blank" rel="noopener">
                                Thread ↗
                              </a>
                            )}
                            {r.draftUrl && (
                              <a className="msrLinkPill" href={r.draftUrl} target="_blank" rel="noopener">
                                Draft ↗
                              </a>
                            )}
<button
  className="msrBtn msrBtnGhost msrBtnSm"
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(r);
  }}
>
  Preview
</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PREVIEW */}
          {selected && (
            <div className="msrPreviewCard">
              <div className="msrPreviewTop">
                <div className="msrPreviewTitle">Draft preview</div>
                <button className="msrBtn msrBtnGhost" onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>

              <div className="msrPreviewMeta">
                <div>
                  <span className="msrK">To:</span> <span className="msrV">{selected.toEmail || ""}</span>
                </div>
                <div>
                  <span className="msrK">Subject:</span>{" "}
                  <span className="msrV">{selected.subject || ""}</span>
                </div>
                <div className="msrPreviewLinks">
                  {selected.threadUrl && (
                    <a className="msrLinkPill" href={selected.threadUrl} target="_blank" rel="noopener">
                      Open thread ↗
                    </a>
                  )}
                  {selected.draftUrl && (
                    <a className="msrLinkPill" href={selected.draftUrl} target="_blank" rel="noopener">
                      Open draft ↗
                    </a>
                  )}
                </div>
              </div>

              <textarea className="msrPreviewBody" readOnly value={selected.draftBody || "(No draft body returned)"} />

              <div className="msrPreviewActions">
                <button
                  className="msrBtn msrBtnPrimary"
                  disabled={busy || !selected.draftId || selected.status !== "drafted" || overLimit}
                  onClick={() => selected.draftId && sendDraftById(selected.draftId)}
                >
                  Send draft
                </button>
                <div className="msrHint">{pvStatus}</div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
