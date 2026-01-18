import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <SignedOut>
        <h1>Reply Tool</h1>
        <p>Please sign in to continue.</p>
      </SignedOut>

      <SignedIn>
        <h1>Reply Tool</h1>
        <p>You’re signed in.</p>
        <Link href="/app">Go to the app →</Link>
      </SignedIn>
    </main>
  );
}
