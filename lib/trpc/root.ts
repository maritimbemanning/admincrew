import { createTRPCRouter } from './init'
import { candidatesRouter } from './routers/candidates'
import { organizationsRouter } from './routers/organizations'

/**
 * Main tRPC router - combine all routers here
 */
export const appRouter = createTRPCRouter({
  candidates: candidatesRouter,
  organizations: organizationsRouter,
  // Add more routers as needed:
  // pools: poolsRouter,
  // contracts: contractsRouter,
  // requests: requestsRouter,
})

export type AppRouter = typeof appRouter
