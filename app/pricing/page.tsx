// app/pricing/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="msrPage">
      <div className="msrContainer">
        <div className="msrTop">
          <div>
            <h1 className="msrH1">Upgrade to Pro</h1>
            <p className="msrP">
              You’re on the MVP. Pro unlocks higher limits + priority support.
              Payments aren’t enabled yet — this page is the “coming soon” upgrade flow.
            </p>
          </div>

          <Link className="msrBtn msrBtnGhost" href="/dashboard">
            ← Back to dashboard
          </Link>
        </div>

        <div className="msrPricingGrid">
          {/* FREE */}
          <div className="msrCard">
            <div className="msrPlanTop">
              <div>
                <div className="msrPlanName">Free</div>
                <div className="msrPlanPrice">$0</div>
              </div>
              <div className="msrBadge">Current default</div>
            </div>

            <ul className="msrUl">
              <li>25 drafts / month</li>
              <li>10 sends / month</li>
              <li>Basic dashboard usage bar</li>
              <li>Community support</li>
            </ul>

            <div className="msrPlanCtaRow">
              <Link className="msrBtn msrBtnGhost msrBtnFull" href="/tool">
                Open Reply Tool
              </Link>
            </div>
          </div>

          {/* PRO */}
          <div className="msrCard msrCardPro">
            <div className="msrPlanTop">
              <div>
                <div className="msrPlanName">Pro</div>
                <div className="msrPlanPrice">$29/mo</div>
                <div className="msrPlanSub">Best for daily use</div>
              </div>
              <div className="msrBadge msrBadgePro">Recommended</div>
            </div>

            <ul className="msrUl">
              <li>500 drafts / month</li>
              <li>250 sends / month</li>
              <li>Priority support</li>
              <li>Higher speed / fewer throttles</li>
              <li>Upcoming: team mode + templates</li>
            </ul>

            <div className="msrPlanCtaRow">
              <button className="msrBtn msrBtnPrimary msrBtnFull" disabled>
                Coming soon (payments not enabled)
              </button>

              <div className="msrHint">
                Want early access? Email{" "}
                <a className="msrLink" href="mailto:user_support@msa-mail.com">
                  user_support@msa-mail.com
                </a>
              </div>
            </div>
          </div>

          {/* TEAM */}
          <div className="msrCard">
            <div className="msrPlanTop">
              <div>
                <div className="msrPlanName">Team</div>
                <div className="msrPlanPrice">Custom</div>
                <div className="msrPlanSub">For multiple inboxes</div>
              </div>
              <div className="msrBadge">Soon</div>
            </div>

            <ul className="msrUl">
              <li>Shared usage pool</li>
              <li>Multiple users</li>
              <li>Admin controls</li>
              <li>Dedicated support</li>
            </ul>

            <div className="msrPlanCtaRow">
              <a
                className="msrBtn msrBtnGhost msrBtnFull"
                href="mailto:user_support@msa-mail.com?subject=Team%20Plan%20Request"
              >
                Contact sales
              </a>
            </div>
          </div>
        </div>

        <div className="msrFooterNote">
          <div className="msrMuted">
            ⚠️ Payments aren’t wired yet. This is the UI + flow so we can connect Stripe later.
          </div>
        </div>
      </div>
    </div>
  );
}
