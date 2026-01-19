// src/lib/usage.ts
import { prisma } from "@/src/lib/prisma";

export type PlanTier = "free" | "pro" | "team";

export function ymNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getLimitsForPlan(plan: PlanTier) {
  // default limits (used if no Plan row exists)
  if (plan === "pro") return { drafts: 200, sends: 100 };
  if (plan === "team") return { drafts: 1000, sends: 500 };
  return { drafts: 25, sends: 10 }; // free
}

/**
 * Reads user's tier from Plan table (if present). Defaults to "free".
 * Your schema screenshot shows model Plan { userId @unique, tier, draftLimit, sendLimit }
 */
export async function getPlanTier(userId: string): Promise<PlanTier> {
  const planRow = await prisma.plan.findUnique({ where: { userId } });
  const tier = (planRow?.tier as PlanTier) ?? "free";
  return tier;
}

/**
 * Ensures a UsageMonth row exists for this (userId, yearMonth).
 * Your schema screenshot shows model UsageMonth { userId, yearMonth, drafts, sends, @@unique([userId, yearMonth]) }
 * Prisma compound unique key name becomes: userId_yearMonth
 */
export async function getUsage(userId: string) {
  const yearMonth = ymNow();

  const usage =
    (await prisma.usageMonth.findUnique({
      where: { userId_yearMonth: { userId, yearMonth } },
    })) ??
    (await prisma.usageMonth.create({
      data: { userId, yearMonth, drafts: 0, sends: 0 },
    }));

  return usage;
}

export async function bumpUsage(
  userId: string,
  kind: "drafts" | "sends",
  amount = 1
) {
  const yearMonth = ymNow();

  return prisma.usageMonth.upsert({
    where: { userId_yearMonth: { userId, yearMonth } },
    create: {
      userId,
      yearMonth,
      drafts: kind === "drafts" ? amount : 0,
      sends: kind === "sends" ? amount : 0,
    },
    update: {
      [kind]: { increment: amount },
    },
  });
}

/**
 * Returns everything the API needs in one shot
 * - plan tier
 * - limits (from Plan row if you set custom limits, else defaults)
 * - usage row
 */
export async function getUsageBundle(userId: string) {
  const yearMonth = ymNow();

  const usage =
    (await prisma.usageMonth.findUnique({
      where: { userId_yearMonth: { userId, yearMonth } },
    })) ??
    (await prisma.usageMonth.create({
      data: { userId, yearMonth, drafts: 0, sends: 0 },
    }));

  const planRow = await prisma.plan.findUnique({ where: { userId } });
  const tier = (planRow?.tier as PlanTier) ?? "free";

  // if you want per-user custom limits from Plan table, use them. otherwise defaults per tier.
  const defaults = getLimitsForPlan(tier);
  const limits = {
    drafts: planRow?.draftLimit ?? defaults.drafts,
    sends: planRow?.sendLimit ?? defaults.sends,
  };

  return { plan: tier, limits, usage };
}
