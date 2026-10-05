/**
 * @fileoverview Tipos dos formulários operacionais do CRM.
 *
 * Um formulário é uma lista de perguntas que o gestor edita sozinho, enviada
 * por link para quem precisa preencher. As respostas ficam guardadas inteiras,
 * e os campos que o dashboard mede também são gravados em coluna própria,
 * através de `targetColumn`.
 *
 * @module types/forms
 */

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'date'
  | 'time'
  | 'select'
  | 'boolean'
  | 'phone'
  | 'file';

export const FORM_FIELD_TYPE_LABEL: Record<FormFieldType, string> = {
  text: 'Texto curto',
  textarea: 'Texto longo',
  number: 'Número',
  currency: 'Valor em reais',
  date: 'Data',
  time: 'Hora',
  select: 'Lista de opções',
  boolean: 'Sim ou não',
  phone: 'Telefone',
  file: 'Arquivo ou foto',
};

export type FormAudience = 'tecnico' | 'vendedor' | 'gestor' | 'cliente';

export const FORM_AUDIENCE_LABEL: Record<FormAudience, string> = {
  tecnico: 'Técnico',
  vendedor: 'Vendedor',
  gestor: 'Gestor',
  cliente: 'Cliente',
};

/** A que registro o formulário se refere. */
export type FormTarget = 'activity' | 'deal';

/**
 * Colunas reais que uma resposta pode alimentar.
 *
 * Só o que o dashboard mede entra aqui. O resto das perguntas vive apenas
 * dentro das respostas, e pode ser renomeado sem quebrar número nenhum.
 */
export const FORM_TARGET_COLUMNS = [
  'activity.arrival_at',
  'activity.visit_status',
  'deal.quote_status',
  'deal.quote_value',
  'deal.quote_items',
  'deal.payment_method',
  'deal.loss_reason',
  'deal.sold_value',
  'deal.discount_value',
  'deal.install_date',
] as const;

export type FormTargetColumn = (typeof FORM_TARGET_COLUMNS)[number];

export const FORM_TARGET_COLUMN_LABEL: Record<FormTargetColumn, string> = {
  'activity.arrival_at': 'Visita: hora de chegada',
  'activity.visit_status': 'Visita: situação',
  'deal.quote_status': 'Orçamento: situação',
  'deal.quote_value': 'Orçamento: valor',
  'deal.quote_items': 'Orçamento: itens',
  'deal.payment_method': 'Forma de pagamento',
  'deal.loss_reason': 'Motivo da recusa',
  'deal.sold_value': 'Venda: valor fechado',
  'deal.discount_value': 'Venda: desconto',
  'deal.install_date': 'Venda: data da instalação',
};

export interface FormField {
  id: string;
  formId: string;
  key: string;
  label: string;
  helpText?: string;
  type: FormFieldType;
  options?: string[];
  required: boolean;
  position: number;
  targetColumn?: FormTargetColumn;
}

export interface CrmForm {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  description?: string;
  audience: FormAudience;
  target: FormTarget;
  intro?: string;
  thanksMessage?: string;
  active: boolean;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

export interface FormSubmissionFile {
  name: string;
  path: string;
  size: number;
  fieldKey: string;
}

export interface FormSubmission {
  id: string;
  formId: string;
  formName?: string;
  formLinkId?: string;
  dealId?: string;
  activityId?: string;
  answers: Record<string, unknown>;
  files: FormSubmissionFile[];
  authorLabel?: string;
  submittedAt: string;
}

export interface FormLink {
  id: string;
  formId: string;
  formName?: string;
  dealId?: string;
  activityId?: string;
  recipientLabel?: string;
  recipientPhone?: string;
  expiresAt: string;
  sentAt?: string;
  openedAt?: string;
  usedAt?: string;
  createdAt: string;
  /** Só volta no momento em que o link é criado. Depois fica só o resumo. */
  url?: string;
}
