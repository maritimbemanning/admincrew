import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * Context for tRPC procedures
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return {
    prisma,
    supabase,
    user,
    headers: opts.headers,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * Initialize tRPC
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * Export reusable router and procedure helpers
 */
export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure

/**
 * Protected (authenticated) procedure
 * Throws UNAUTHORIZED if no user is logged in
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  })
})
