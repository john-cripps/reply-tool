import { auth } from "@clerk/nextjs/server";

export default function AppPage() {
  const { userId } = auth();

  return (
    <main style={{ padding: 24 }}>
      <h1>Reply Tool App</h1>
      <p>Logged in as: {userId}</p>
    </main>
  );
}
