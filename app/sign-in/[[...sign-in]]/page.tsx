import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>
          Sign in
        </h1>

        <p style={{ opacity: 0.6, marginBottom: 20 }}>
          Access the Reply Tool
        </p>

        <SignIn routing="path" path="/sign-in" />
      </div>
    </main>
  );
}
