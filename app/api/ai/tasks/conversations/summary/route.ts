import { generateText, Output } from 'ai';
import { z } from 'zod';
import { requireAITaskContext, AITaskHttpError } from '@/lib/ai/tasks/server';
import {
  buildTranscript,
  CONVERSATION_SUMMARY_SYSTEM,
  ConversationSummarySchema,
  type TranscriptMessage,
} from '@/lib/ai/conversationSummary';

export const maxDuration = 60;

/** Mensagens mais recentes que entram no resumo. */
const MAX_MESSAGES = 80;

const InputSchema = z.object({ conversationId: z.string().uuid() });

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/**
 * POST /api/ai/tasks/conversations/summary — resume o que já foi falado numa
 * conversa (botão "Resumo" em Conversas). Só lê; não move negócio nem grava nada.
 */
export async function POST(req: Request) {
  try {
    const { model, supabase, organizationId } = await requireAITaskContext(req);
    const { conversationId } = InputSchema.parse(await req.json().catch(() => null));

    const { data: conversation } = await supabase
      .from('messaging_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('organization_id', organizationId)
      .maybeSingle();
    if (!conversation) return json({ error: { code: 'NOT_FOUND', message: 'Conversa não encontrada.' } }, 404);

    const { data: rows, error } = await supabase
      .from('messaging_messages')
      .select('direction, content_type, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(MAX_MESSAGES);
    if (error) throw error;

    const messages: TranscriptMessage[] = (rows ?? [])
      .reverse()
      .map((r) => ({
        direction: r.direction as TranscriptMessage['direction'],
        contentType: (r.content_type as string) || 'text',
        content: (r.content as Record<string, unknown> | null) ?? null,
      }));

    if (messages.length === 0) {
      return json({ summary: { resumo: [], falta: undefined, proximoPasso: undefined } });
    }

    const result = await generateText({
      model,
      maxRetries: 2,
      system: CONVERSATION_SUMMARY_SYSTEM,
      prompt: `Resuma a conversa abaixo.\n\n${buildTranscript(messages)}`,
      output: Output.object({ schema: ConversationSummarySchema }),
    });

    return json({ summary: result.output });
  } catch (err: unknown) {
    if (err instanceof AITaskHttpError) return err.toResponse();
    if (err instanceof z.ZodError) {
      return json({ error: { code: 'INVALID_INPUT', message: 'Payload inválido.' } }, 400);
    }
    console.error('[api/ai/tasks/conversations/summary] Error:', err);
    return json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível resumir a conversa.' } }, 500);
  }
}
