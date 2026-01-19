import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Reply Tool</h1>
      <p>
        <Link href="/dashboard">Go to dashboard</Link>
      </p>
      <p>
        <Link href="/sign-in">Sign in</Link>
      </p>
    </main>
  );
}
