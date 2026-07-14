export interface RaceRecommendationDriver {
  driverNumber: string;
  driverCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  team: string;
  teamColor: string;
}

export interface RaceRecommendationTraffic {
  score: number;

  cleanAirPercentage: number;

  timeInDirtyAir: number;

  weightedDirtyAir: number;

  averageWakePercentage: number;

  maximumWakePercentage: number;

  averageFollowingGapDistance: number | null;

  closestFollowingGapDistance: number | null;
}

export interface RaceRecommendationDrs {
  nearestCarAhead: string | null;

  drsUsagePercentage: number;

  drsWhileFollowingPercentage: number;
}

export interface RepresentativeScore {
  score: number;

  representative: boolean;

  lapTime: LapTimeScore;

  sector: SectorScore;

  position: PositionScore;

  traffic: TrafficScore;
}

export interface LapTimeScore {
  score: number;

  deltaSeconds: number;
}

export interface SectorScore {
  score: number;

  sector1Delta: number;

  sector2Delta: number;

  sector3Delta: number;
}

export interface PositionScore {
  score: number;

  deltaPosition: number;
}

export interface TrafficScore {
  score: number;
}

export interface RecommendationLap {
  lapNumber: number;

  position: number;

  compound: string;

  tyreAge: number;

  lapTimeSeconds: number;

  representative: RepresentativeScore;

  traffic: RaceRecommendationTraffic;

  drs: RaceRecommendationDrs;
}

export interface SingleDriverRecommendationResponse {
  year: number;

  round: number;

  driver: RaceRecommendationDriver;

  stints: SingleDriverStint[];
}

export interface SingleDriverStint {
  stint: number;

  compound: string;

  lapCount: number;

  laps: SingleDriverRecommendation[];
}

export interface SingleDriverRecommendation {
  lapNumber: number;

  position: number;

  compound: string;

  tyreAge: number;

  lapTimeSeconds: number;

  representative: RepresentativeScore;

  traffic: RaceRecommendationTraffic;

  drs: RaceRecommendationDrs;

  reasons: string[];
}

export interface DualDriverRecommendationResponse {
  year: number;

  round: number;

  driverA: RaceRecommendationDriver;

  driverB: RaceRecommendationDriver;

  stintComparisons: StintComparison[];
}

export interface StintComparison {
  driverAStint: number;

  driverBStint: number;

  compoundA: string;

  compoundB: string;

  recommendationGroups: RecommendationGroup[];
}

export interface RecommendationGroup {
  secondaryLap: number;

  recommendations: RecommendationPair[];
}

export interface RecommendationPair {
  compatibilityScore: number;

  lapA: RecommendationLap;

  lapB: RecommendationLap;

  reasons: string[];
}

export interface DualRecommendationCard {
  recommendations: RecommendationPair[];
}

export interface DualRecommendationStint {
  driverAStint: number;

  driverBStint: number;

  cards: DualRecommendationCard[];
}
