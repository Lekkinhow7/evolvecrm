/**
 * @fileoverview Serviço dos formulários operacionais.
 *
 * Usa o cliente do navegador: o isolamento por empresa vem do RLS, igual ao
 * resto do CRM. A criação de link assinado e o preenchimento público ficam em
 * rotas de servidor, porque mexem com token.
 *
 * @module lib/supabase/forms
 */

import { supabase } from './client';
import type {
  CrmForm,
  FormField,
  FormLink,
  FormSubmission,
  FormTargetColumn,
} from '@/types/forms';

interface DbForm {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  description: string | null;
  audience: string;
  target: string;
  intro: string | null;
  thanks_message: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  form_fields?: DbFormField[];
}

interface DbFormField {
  id: string;
  form_id: string;
  key: string;
  label: string;
  help_text: string | null;
  type: string;
  options: string[] | null;
  required: boolean;
  position: number;
  target_column: string | null;
}

const toField = (db: DbFormField): FormField => ({
  id: db.id,
  formId: db.form_id,
  key: db.key,
  label: db.label,
  helpText: db.help_text || undefined,
  type: db.type as FormField['type'],
  options: db.options || undefined,
  required: db.required,
  position: db.position,
  targetColumn: (db.target_column as FormTargetColumn) || undefined,
});

const toForm = (db: DbForm): CrmForm => ({
  id: db.id,
  organizationId: db.organization_id,
  key: db.key,
  name: db.name,
  description: db.description || undefined,
  audience: db.audience as CrmForm['audience'],
  target: db.target as CrmForm['target'],
  intro: db.intro || undefined,
  thanksMessage: db.thanks_message || undefined,
  active: db.active,
  fields: (db.form_fields || []).slice().sort((a, b) => a.position - b.position).map(toField),
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

/** Gera uma chave estável a partir do rótulo, para a resposta não depender do texto. */
export function slugifyKey(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 50) || 'campo';
}

async function organizationId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single();
  return (data as { organization_id?: string } | null)?.organization_id ?? null;
}

export const formsService = {
  async list(): Promise<{ data: CrmForm[] | null; error: Error | null }> {
    if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
    const { data, error } = await supabase
      .from('forms')
      .select('*, form_fields(*)')
      .order('created_at', { ascending: true });
    if (error) return { data: null, error: error as unknown as Error };
    return { data: (data as DbForm[]).map(toForm), error: null };
  },

  async create(input: {
    name: string;
    audience: CrmForm['audience'];
    target: CrmForm['target'];
    description?: string;
    intro?: string;
  }): Promise<{ data: CrmForm | null; error: Error | null }> {
    if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
    const org = await organizationId();
    if (!org) return { data: null, error: new Error('Sessão sem empresa') };
    const base = slugifyKey(input.name);
    const { data, error } = await supabase
      .from('forms')
      .insert({
        organization_id: org,
        key: `${base}_${Date.now().toString(36).slice(-4)}`,
        name: input.name,
        audience: input.audience,
        target: input.target,
        description: input.description || null,
        intro: input.intro || null,
      })
      .select('*, form_fields(*)')
      .single();
    if (error) return { data: null, error: error as unknown as Error };
    return { data: toForm(data as DbForm), error: null };
  },

  async update(id: string, updates: Partial<CrmForm>): Promise<{ error: Error | null }> {
    if (!supabase) return { error: new Error('Supabase não configurado') };
    const db: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) db.name = updates.name;
    if (updates.description !== undefined) db.description = updates.description || null;
    if (updates.audience !== undefined) db.audience = updates.audience;
    if (updates.intro !== undefined) db.intro = updates.intro || null;
    if (updates.thanksMessage !== undefined) db.thanks_message = updates.thanksMessage || null;
    if (updates.active !== undefined) db.active = updates.active;
    const { error } = await supabase.from('forms').update(db).eq('id', id);
    return { error: (error as unknown as Error) || null };
  },

  async remove(id: string): Promise<{ error: Error | null }> {
    if (!supabase) return { error: new Error('Supabase não configurado') };
    const { error } = await supabase.from('forms').delete().eq('id', id);
    return { error: (error as unknown as Error) || null };
  },

  async saveField(
    formId: string,
    field: Partial<FormField> & { label: string },
  ): Promise<{ data: FormField | null; error: Error | null }> {
    if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
    const org = await organizationId();
    if (!org) return { data: null, error: new Error('Sessão sem empresa') };

    const payload: Record<string, unknown> = {
      organization_id: org,
      form_id: formId,
      label: field.label,
      help_text: field.helpText || null,
      type: field.type || 'text',
      options: field.options && field.options.length ? field.options : null,
      required: Boolean(field.required),
      position: field.position ?? 0,
      target_column: field.targetColumn || null,
    };

    if (field.id) {
      const { data, error } = await supabase
        .from('form_fields')
        .update(payload)
        .eq('id', field.id)
        .select('*')
        .single();
      if (error) return { data: null, error: error as unknown as Error };
      return { data: toField(data as DbFormField), error: null };
    }

    // Chave nova nasce do rótulo e nunca muda depois, para não perder histórico.
    payload.key = `${slugifyKey(field.label)}_${Date.now().toString(36).slice(-4)}`;
    const { data, error } = await supabase.from('form_fields').insert(payload).select('*').single();
    if (error) return { data: null, error: error as unknown as Error };
    return { data: toField(data as DbFormField), error: null };
  },

  async removeField(id: string): Promise<{ error: Error | null }> {
    if (!supabase) return { error: new Error('Supabase não configurado') };
    const { error } = await supabase.from('form_fields').delete().eq('id', id);
    return { error: (error as unknown as Error) || null };
  },

  async reorderFields(fields: Array<{ id: string; position: number }>): Promise<{ error: Error | null }> {
    if (!supabase) return { error: new Error('Supabase não configurado') };
    for (const f of fields) {
      const { error } = await supabase.from('form_fields').update({ position: f.position }).eq('id', f.id);
      if (error) return { error: error as unknown as Error };
    }
    return { error: null };
  },

  async submissionsFor(
    scope: { dealId?: string; activityId?: string },
  ): Promise<{ data: FormSubmission[] | null; error: Error | null }> {
    if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
    let query = supabase
      .from('form_submissions')
      .select('*, forms:form_id (name)')
      .order('submitted_at', { ascending: false });
    if (scope.dealId) query = query.eq('deal_id', scope.dealId);
    if (scope.activityId) query = query.eq('activity_id', scope.activityId);
    const { data, error } = await query;
    if (error) return { data: null, error: error as unknown as Error };
    const rows = (data || []) as Array<Record<string, any>>;
    return {
      data: rows.map((r) => ({
        id: r.id,
        formId: r.form_id,
        formName: r.forms?.name,
        formLinkId: r.form_link_id || undefined,
        dealId: r.deal_id || undefined,
        activityId: r.activity_id || undefined,
        answers: r.answers || {},
        files: r.files || [],
        authorLabel: r.author_label || undefined,
        submittedAt: r.submitted_at,
      })),
      error: null,
    };
  },

  /** Tudo que já foi respondido num formulário, com de onde veio. */
  async submissionsByForm(formId: string): Promise<{ data: FormSubmission[] | null; error: Error | null }> {
    if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*, deals:deal_id (title), activities:activity_id (title, date)')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false })
      .limit(200);
    if (error) return { data: null, error: error as unknown as Error };
    const rows = (data || []) as Array<Record<string, any>>;
    return {
      data: rows.map((r) => ({
        id: r.id,
        formId: r.form_id,
        formName: r.activities?.title || r.deals?.title,
        formLinkId: r.form_link_id || undefined,
        dealId: r.deal_id || undefined,
        activityId: r.activity_id || undefined,
        answers: r.answers || {},
        files: r.files || [],
        authorLabel: r.author_label || undefined,
        submittedAt: r.submitted_at,
      })),
      error: null,
    };
  },

  async linksFor(
    scope: { dealId?: string; activityId?: string },
  ): Promise<{ data: FormLink[] | null; error: Error | null }> {
    if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
    let query = supabase
      .from('form_links')
      .select('*, forms:form_id (name)')
      .order('created_at', { ascending: false });
    if (scope.dealId) query = query.eq('deal_id', scope.dealId);
    if (scope.activityId) query = query.eq('activity_id', scope.activityId);
    const { data, error } = await query;
    if (error) return { data: null, error: error as unknown as Error };
    const rows = (data || []) as Array<Record<string, any>>;
    return {
      data: rows.map((r) => ({
        id: r.id,
        formId: r.form_id,
        formName: r.forms?.name,
        dealId: r.deal_id || undefined,
        activityId: r.activity_id || undefined,
        recipientLabel: r.recipient_label || undefined,
        recipientPhone: r.recipient_phone || undefined,
        expiresAt: r.expires_at,
        sentAt: r.sent_at || undefined,
        openedAt: r.opened_at || undefined,
        usedAt: r.used_at || undefined,
        createdAt: r.created_at,
      })),
      error: null,
    };
  },
};
