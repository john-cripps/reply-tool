import { prisma } from "./prisma";

const ymNow = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

export async function getPlanAndUsage(userId: string) {
  const yearMonth = ymNow();

  const plan = await prisma.plan.upsert({
    where: { userId },
    update: {},
    create: { userId, tier: "free", draftLimit: 50, sendLimit: 10 },
  });

  const usage = await prisma.usageMonth.upsert({
    where: { userId_yearMonth: { userId, yearMonth } },
    update: {},
    create: { userId, yearMonth, drafts: 0, sends: 0 },
  });

  return { plan, usage, yearMonth };
}

export async function enforceLimit(userId: string, kind: "draft" | "send") {
  const { plan, usage } = await getPlanAndUsage(userId);

  const used = kind === "draft" ? usage.drafts : usage.sends;
  const limit = kind === "draft" ? plan.draftLimit : plan.sendLimit;

  if (used >= limit) {
    return { ok: false as const, used, limit, tier: plan.tier };
  }

  return { ok: true as const, used, limit, tier: plan.tier };
}

export async function incrementUsage(userId: string, kind: "draft" | "send", amount = 1) {
  const yearMonth = ymNow();

  const data =
    kind === "draft"
      ? { drafts: { increment: amount } }
      : { sends: { increment: amount } };

  return prisma.usageMonth.upsert({
    where: { userId_yearMonth: { userId, yearMonth } },
    update: data,
    create: {
      userId,
      yearMonth,
      drafts: kind === "draft" ? amount : 0,
      sends: kind === "send" ? amount : 0,
    },
  });
}

