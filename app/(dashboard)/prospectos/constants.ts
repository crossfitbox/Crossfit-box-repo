export const STAGES = [
  'new',
  'contacted',
  'trial_scheduled',
  'trial_completed',
  'converted',
] as const;

export type Stage = (typeof STAGES)[number] | 'lost';
