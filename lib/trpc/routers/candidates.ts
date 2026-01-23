import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../init'

export const candidatesRouter = createTRPCRouter({
  // Get all candidates with pagination and filters
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(['active', 'inactive', 'archived']).optional(),
      poolId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, status, poolId } = input
      const skip = (page - 1) * limit

      const where = {
        ...(search && {
          OR: [
            { first_name: { contains: search, mode: 'insensitive' as const } },
            { last_name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(status && { status }),
        ...(poolId && {
          candidate_pool_memberships: {
            some: { pool_id: poolId },
          },
        }),
      }

      const [candidates, total] = await Promise.all([
        ctx.prisma.candidates.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            candidate_certifications: true,
            candidate_pool_memberships: {
              include: {
                candidate_pools: true,
              },
            },
          },
        }),
        ctx.prisma.candidates.count({ where }),
      ])

      return {
        candidates,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }),

  // Get single candidate by ID
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const candidate = await ctx.prisma.candidates.findUnique({
        where: { id: input.id },
        include: {
          candidate_certifications: true,
          candidate_documents: true,
          candidate_pool_memberships: {
            include: {
              candidate_pools: true,
            },
          },
          assignments: {
            include: {
              customer_requests: true,
            },
          },
        },
      })

      if (!candidate) {
        throw new Error('Candidate not found')
      }

      return candidate
    }),

  // Create new candidate
  create: protectedProcedure
    .input(z.object({
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      nationality: z.string().optional(),
      address_city: z.string().optional(),
      primary_role: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const candidate = await ctx.prisma.candidates.create({
        data: {
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email,
          phone: input.phone,
          address_city: input.address_city,
          primary_role: input.primary_role,
          status: 'active',
          pipeline_stage: 'ny',
          created_by: ctx.user.id,
        },
      })

      return candidate
    }),

  // Update candidate
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        first_name: z.string().min(1).optional(),
        last_name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        status: z.enum(['active', 'inactive', 'archived']).optional(),
        primary_role: z.string().optional(),
        years_experience: z.number().optional(),
        internal_rating: z.number().min(1).max(5).optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const candidate = await ctx.prisma.candidates.update({
        where: { id: input.id },
        data: {
          ...input.data,
          updated_by: ctx.user.id,
          updated_at: new Date(),
        },
      })

      return candidate
    }),

  // Get dashboard stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, newThisMonth, byStatus] = await Promise.all([
      ctx.prisma.candidates.count(),
      ctx.prisma.candidates.count({ where: { status: 'active' } }),
      ctx.prisma.candidates.count({
        where: {
          created_at: {
            gte: new Date(new Date().setDate(1)),
          },
        },
      }),
      ctx.prisma.candidates.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    return {
      total,
      active,
      newThisMonth,
      byStatus: byStatus.reduce((acc, curr) => {
        acc[curr.status || 'unknown'] = curr._count
        return acc
      }, {} as Record<string, number>),
    }
  }),
})
