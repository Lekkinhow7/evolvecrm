/**
 * @fileoverview Porta de documentos: o n8n/IA chama aqui com os links dos
 * documentos que o cliente mandou pelo WhatsApp. Repetir o pedido não duplica.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { authPublicApi } from '@/lib/public-api/auth'
import { createStaticAdminClient } from '@/lib/supabase/server'
import { NegocioNaoEncontrado, registrarDocumentos } from '@/lib/agenda/documentos'

export const runtime = 'nodejs'
export const maxDuration = 60

const BodySchema = z
  .object({
    phone: z.string().trim().min(8).max(30).optional(),
    deal_id: z.string().uuid().optional(),
    note: z.string().trim().max(4000).optional(),
    files: z
      .array(
        z.object({
          url: z.string().trim().url().max(2000),
          file_name: z.string().trim().min(1).max(200),
          mime_type: z.string().trim().min(1).max(100),
          external_ref: z.string().trim().min(1).max(200).optional(),
        }),
      )
      .min(1)
      .max(10),
  })
  .refine((v) => Boolean(v.phone || v.deal_id), { message: 'Informe o telefone do cliente ou o negócio' })

export async function POST(request: Request) {
  const auth = await authPublicApi(request)
  if (!auth.ok) return NextResponse.json(auth.body, { status: auth.status })

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', code: 'VALIDATION_ERROR', details: parsed.error.issues.map((i) => i.message) },
      { status: 422 },
    )
  }
  const body = parsed.data

  try {
    const r = await registrarDocumentos(createStaticAdminClient(), {
      organizationId: auth.organizationId,
      phone: body.phone,
      dealId: body.deal_id,
      note: body.note,
      files: body.files.map((f) => ({
        url: f.url,
        fileName: f.file_name,
        mimeType: f.mime_type,
        externalRef: f.external_ref,
      })),
    })
    return NextResponse.json({
      ok: true,
      deal_id: r.dealId,
      salvos: r.saved,
      ignorados: r.skipped.map((s) => ({ file_name: s.fileName, motivo: s.reason })),
      tarefa_id: r.taskId,
      avisos: r.warnings,
    })
  } catch (erro) {
    if (erro instanceof NegocioNaoEncontrado) {
      return NextResponse.json({ error: 'Negócio não encontrado', code: 'DEAL_NOT_FOUND' }, { status: 404 })
    }
    console.error('[documentos] falha ao registrar', erro)
    return NextResponse.json({ error: 'Não foi possível registrar os documentos', code: 'DOCUMENTS_FAILED' }, { status: 500 })
  }
}
