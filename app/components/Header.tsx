"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function Header() {
  return (
    <header
      style={{
        position: "fixed",
        top: 20,
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        padding: "0 16px",
      }}
    >
      <nav
        style={{
          width: "min(1000px, 92vw)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "14px 22px",
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.16)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/msa.png"
            alt="MSA"
            style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }}
          />
          <strong style={{ fontSize: 16 }}>Main Street AI</strong>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="pillBtn">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="pillBtn pillBtnPrimary">Sign up</button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
}
