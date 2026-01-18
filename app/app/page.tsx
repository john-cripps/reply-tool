import { auth } from "@clerk/nextjs/server";

export default async function AppPage() {
  const { userId } = await auth();

  return (
    <main style={{ padding: 24 }}>
      <h1>Reply Tool App</h1>
      <p>Logged in as: {userId}</p>
      <p>If you can see this, /app is protected and auth is working.</p>
    </main>
  );
}
