import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../init'

export const organizationsRouter = createTRPCRouter({
  // List organizations with filters
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      customerType: z.string().optional(),
      pipelineStage: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, search, customerType, pipelineStage } = input
      const skip = (page - 1) * limit

      const where = {
        archived_at: null,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { org_number: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(customerType && { customer_type: customerType }),
        ...(pipelineStage && { pipeline_stage: pipelineStage as any }),
      }

      const [organizations, total] = await Promise.all([
        ctx.prisma.crm_organizations.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
          include: {
            crm_contacts: { take: 3 },
            crm_deals: { where: { stage: { not: 'closed_won' } }, take: 5 },
            _count: {
              select: {
                contracts: true,
                customer_requests: true,
                assignments: true,
              },
            },
          },
        }),
        ctx.prisma.crm_organizations.count({ where }),
      ])

      return {
        organizations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    }),

  // Get organization by ID with full details
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const organization = await ctx.prisma.crm_organizations.findUnique({
        where: { id: input.id },
        include: {
          crm_contacts: true,
          crm_deals: { orderBy: { created_at: 'desc' } },
          crm_activities: { orderBy: { created_at: 'desc' }, take: 20 },
          customer_requests: { orderBy: { created_at: 'desc' }, take: 10 },
          contracts: { take: 10 },
        },
      })

      if (!organization) {
        throw new Error('Organization not found')
      }

      return organization
    }),

  // Create organization
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      org_number: z.string().optional(),
      industry: z.string().optional(),
      customer_type: z.string().default('prospect'),
      website: z.string().url().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address_street: z.string().optional(),
      address_postal_code: z.string().optional(),
      address_city: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.crm_organizations.create({
        data: {
          ...input,
          pipeline_stage: 'lead',
          created_by: ctx.user.id,
        },
      })

      return organization
    }),

  // Update organization
  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().optional(),
        org_number: z.string().optional(),
        industry: z.string().optional(),
        customer_type: z.string().optional(),
        pipeline_stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
        website: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { pipeline_stage, ...restData } = input.data
      const organization = await ctx.prisma.crm_organizations.update({
        where: { id: input.id },
        data: {
          ...restData,
          ...(pipeline_stage && { pipeline_stage: pipeline_stage as any }),
          updated_by: ctx.user.id,
          updated_at: new Date(),
        },
      })

      return organization
    }),

  // Dashboard stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const [total, customers, prospects, byPipeline] = await Promise.all([
      ctx.prisma.crm_organizations.count({ where: { archived_at: null } }),
      ctx.prisma.crm_organizations.count({ 
        where: { customer_type: 'customer', archived_at: null } 
      }),
      ctx.prisma.crm_organizations.count({ 
        where: { customer_type: 'prospect', archived_at: null } 
      }),
      ctx.prisma.crm_organizations.groupBy({
        by: ['pipeline_stage'],
        where: { archived_at: null },
        _count: true,
      }),
    ])

    return {
      total,
      customers,
      prospects,
      byPipeline: byPipeline.reduce((acc, curr) => {
        acc[curr.pipeline_stage || 'unknown'] = curr._count
        return acc
      }, {} as Record<string, number>),
    }
  }),
})
