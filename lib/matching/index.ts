// Matching Engine - Public API
export { runMatching, quickMatch, getMatchStats } from './engine'
export { 
  calculateAllScores,
  calculateTotalScore,
  scoreCertifications, 
  scoreExperience, 
  scoreProximity as scoreLocation, 
  scoreAvailability,
  scoreLanguages,
  scoreRating,
  identifyBlockers,
  isFullMatch,
} from './scoring'
export {
  applyHardFilters,
  filterByCertifications,
  filterByBlockingStatus,
  filterByLanguages,
  filterByAvailability,
  filterByPool,
  excludeShortlisted,
  type FilterResult,
} from './filters'
export type {
  CandidateSearchRecord,
  MatchingWeights,
  ScoringContext,
} from './types'
export { DEFAULT_WEIGHTS } from './types'
