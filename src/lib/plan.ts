export const LIMITS = {
  free: { drafts: 25, sends: 10 },
  pro:  { drafts: 500, sends: 250 },
};

export function getPlanForUser(_userId: string) {
  // MVP: everyone free. Later: look up subscription table / Stripe.
  return "free" as const;
}
