import { z } from 'zod'

import { isAllowedOrigin } from '@/lib/security/sameOrigin'
import { createClient } from '@/lib/supabase/server'

const SellerSchema = z.object({
  profileId: z.string().uuid(),
  position: z.number().int().min(0),
  eligible: z.boolean(),
  pausedUntil: z.string().datetime({ offset: true }).nullable(),
})

const BodySchema = z
  .object({ sellers: z.array(SellerSchema).max(200) })
  .strict()
  .superRefine((value, context) => {
    const profileIds = value.sellers.map((seller) => seller.profileId)
    const positions = value.sellers.map((seller) => seller.position)
    if (new Set(profileIds).size !== profileIds.length) {
      context.addIssue({ code: 'custom', message: 'Perfis duplicados' })
    }
    if (new Set(positions).size !== positions.length) {
      context.addIssue({ code: 'custom', message: 'Posições duplicadas' })
    }
  })

function json(body: unknown, status = 200) {
  return Response.json(body, { status })
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, response: json({ error: 'Unauthorized' }, 401) }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id,role,organization_id')
    .eq('id', user.id)
    .single()
  if (error || !profile?.organization_id) {
    return { ok: false as const, response: json({ error: 'Profile not found' }, 404) }
  }
  if (profile.role !== 'admin') {
    return { ok: false as const, response: json({ error: 'Forbidden' }, 403) }
  }
  return {
    ok: true as const,
    supabase,
    organizationId: profile.organization_id as string,
  }
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const roster = await auth.supabase
    .from('succaozero_seller_roster')
    .select('profile_id,position,eligible,paused_until')
    .eq('organization_id', auth.organizationId)
    .order('position', { ascending: true })
  if (roster.error) return json({ error: roster.error.message }, 500)

  const state = await auth.supabase
    .from('succaozero_routing_state')
    .select('next_position,version')
    .eq('organization_id', auth.organizationId)
    .maybeSingle()
  if (state.error) return json({ error: state.error.message }, 500)

  const profileIds = (roster.data || []).map((seller: any) => seller.profile_id as string)
  let profiles: any[] = []
  let assignments: any[] = []
  if (profileIds.length > 0) {
    const profilesResult = await auth.supabase
      .from('profiles')
      .select('id,email')
      .eq('organization_id', auth.organizationId)
      .in('id', profileIds)
    if (profilesResult.error) return json({ error: profilesResult.error.message }, 500)
    profiles = profilesResult.data || []

    const assignmentsResult = await auth.supabase
      .from('succaozero_opportunities')
      .select('owner_profile_id,updated_at')
      .eq('organization_id', auth.organizationId)
      .in('owner_profile_id', profileIds)
      .order('updated_at', { ascending: false })
    if (assignmentsResult.error) return json({ error: assignmentsResult.error.message }, 500)
    assignments = assignmentsResult.data || []
  }

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]))
  const lastAssignmentByProfile = new Map<string, string>()
  for (const assignment of assignments) {
    if (assignment.owner_profile_id && !lastAssignmentByProfile.has(assignment.owner_profile_id)) {
      lastAssignmentByProfile.set(assignment.owner_profile_id, assignment.updated_at)
    }
  }

  const sellers = (roster.data || []).map((seller: any) => ({
    profileId: seller.profile_id,
    email: profileById.get(seller.profile_id)?.email || '',
    position: seller.position,
    eligible: seller.eligible,
    pausedUntil: seller.paused_until,
    lastAssignedAt: lastAssignmentByProfile.get(seller.profile_id) || null,
  }))
  const nextPosition = Number(state.data?.next_position ?? 0)
  const eligible = sellers.filter(
    (seller) => seller.eligible && (!seller.pausedUntil || Date.parse(seller.pausedUntil) <= Date.now()),
  )
  const nextSeller = eligible.find((seller) => seller.position >= nextPosition) || eligible[0]

  return json({
    sellers,
    nextProfileId: nextSeller?.profileId || null,
    version: Number(state.data?.version ?? 0),
  })
}

export async function PUT(request: Request) {
  if (!isAllowedOrigin(request)) return json({ error: 'Forbidden' }, 403)

  const auth = await requireAdmin()
  if (!auth.ok) return auth.response

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return json({ error: 'Invalid payload', code: 'VALIDATION_ERROR' }, 422)
  }

  const profileIds = parsed.data.sellers.map((seller) => seller.profileId)
  if (profileIds.length > 0) {
    const profiles = await auth.supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .in('id', profileIds)
    if (profiles.error) return json({ error: profiles.error.message, code: 'DB_ERROR' }, 500)
    if ((profiles.data || []).length !== new Set(profileIds).size) {
      return json(
        { error: 'Seller is outside the organization', code: 'RELATIONSHIP_SCOPE_ERROR' },
        422,
      )
    }
  }

  const { data, error } = await auth.supabase.rpc('succaozero_set_seller_roster', {
    p_payload: {
      organization_id: auth.organizationId,
      sellers: parsed.data.sellers.map((seller) => ({
        profile_id: seller.profileId,
        position: seller.position,
        eligible: seller.eligible,
        paused_until: seller.pausedUntil,
      })),
    },
  })
  if (error) return json({ error: error.message, code: 'DB_ERROR' }, 500)

  return json({
    ...data,
    warning: parsed.data.sellers.length === 0
      ? 'Rodízio sem vendedor: novos leads ficarão aguardando responsável.'
      : null,
  })
}
