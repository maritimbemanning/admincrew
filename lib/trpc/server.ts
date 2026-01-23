import 'server-only'
import { createCallerFactory } from './init'
import { appRouter } from './root'
import { createTRPCContext } from './init'
import { headers } from 'next/headers'
import { cache } from 'react'

/**
 * Create a server-side tRPC caller
 * This can be used in Server Components and Server Actions
 */
const createCaller = createCallerFactory(appRouter)

export const api = cache(async () => {
  const heads = await headers()
  return createCaller(await createTRPCContext({ headers: heads }))
})
