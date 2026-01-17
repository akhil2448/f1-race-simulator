// track-status.types.ts
export type TrackStatusType =
  | 'GREEN'
  | 'YELLOW'
  | 'SC'
  | 'VSC'
  | 'RED'
  | 'VSC_ENDING'
  | null;

export const TRACK_STATUS_MAP: Record<number, TrackStatusType> = {
  1: 'GREEN',
  2: 'YELLOW',
  4: 'SC',
  5: 'RED',
  6: 'VSC',
  7: 'VSC_ENDING', // ending → visually same, then GREEN follows
};
