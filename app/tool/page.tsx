// app/tool/page.tsx
export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ReplyToolClient from "./reply-tool-client";

export default async function ToolPage() {
  const { userId } = await auth();

  // If they're NOT signed in, send them to sign-in
  // After sign-in, they'll be redirected back to /tool
  if (!userId) {
    redirect("/sign-in?redirect_url=/tool");
  }

  // If they ARE signed in, show the tool
  return <ReplyToolClient userId={userId} />;
}
