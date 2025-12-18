// Matching Engine - Public API
export { runMatching, quickMatch, getMatchStats } from './engine'
export type {
  CandidateSearchRecord,
  MatchingWeights,
  ScoringContext,
  CandidateScores,
  MatchRecommendation,
  MatchBlockerInfo,
} from './types'
export { DEFAULT_WEIGHTS, getRecommendation } from './types'
