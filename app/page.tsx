import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Reply Tool</h1>
        <p>Please sign in to continue.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Reply Tool</h1>
      <p>You’re signed in 🎉</p>
    </main>
  );
}
