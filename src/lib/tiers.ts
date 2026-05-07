// Client-side mirror of tier limits. Server is the source of truth (supabase/functions/_shared/tier-limits.ts).
export type Tier = 'free' | 'starter' | 'growth' | 'agency';

export interface TierInfo {
  id: Tier;
  label: string;
  price: string;
  smsPerMonth: number;
  clients: number;
  aiReplies: boolean;
}

export const TIERS: TierInfo[] = [
  { id: 'free', label: 'Free', price: '$0', smsPerMonth: 20, clients: 1, aiReplies: false },
  {
    id: 'starter',
    label: 'Starter',
    price: '$29/mo',
    smsPerMonth: 150,
    clients: 1,
    aiReplies: true,
  },
  {
    id: 'growth',
    label: 'Growth',
    price: '$79/mo',
    smsPerMonth: 500,
    clients: 3,
    aiReplies: true,
  },
  {
    id: 'agency',
    label: 'Agency',
    price: '$249/mo',
    smsPerMonth: 2000,
    clients: 25,
    aiReplies: true,
  },
];

export const tierByName = (t: Tier | string | null | undefined): TierInfo =>
  TIERS.find((x) => x.id === t) || TIERS[0];
