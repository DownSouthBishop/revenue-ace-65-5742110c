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
  { id: 'free', label: 'Free', price: '$0', smsPerMonth: 50, clients: 1, aiReplies: false },
  {
    id: 'starter',
    label: 'Starter',
    price: '$49/mo',
    smsPerMonth: 1000,
    clients: 1,
    aiReplies: true,
  },
  {
    id: 'growth',
    label: 'Growth',
    price: '$149/mo',
    smsPerMonth: 5000,
    clients: 5,
    aiReplies: true,
  },
  {
    id: 'agency',
    label: 'Agency',
    price: '$497/mo',
    smsPerMonth: 50000,
    clients: 50,
    aiReplies: true,
  },
];

export const tierByName = (t: Tier | string | null | undefined): TierInfo =>
  TIERS.find((x) => x.id === t) || TIERS[0];
