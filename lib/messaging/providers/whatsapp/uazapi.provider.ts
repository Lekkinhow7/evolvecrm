/**
 * @fileoverview uazapi WhatsApp Provider
 *
 * Envia mensagens pelo número de WhatsApp conectado na uazapi. É o mesmo número
 * em que o agente de IA (n8n) atende: o CRM só envia; quem recebe os eventos da
 * uazapi é o n8n, que repassa uma cópia para `/api/public/v1/whatsapp`.
 *
 * Toda mensagem enviada daqui leva `track_source: 'crm'`. É por essa marca que o
 * n8n reconhece a mensagem de um consultor e pausa o agente naquele cliente.
 *
 * @see https://docs.uazapi.com/
 *
 * @module lib/messaging/providers/whatsapp/uazapi
 */

import { BaseChannelProvider } from '../base.provider';
import type {
  ChannelType,
  ProviderConfig,
  ValidationResult,
  ValidationError,
  ConnectionStatusResult,
  SendMessageParams,
  SendMessageResult,
  WebhookHandlerResult,
  ErrorEvent,
  TextContent,
  ImageContent,
  DocumentContent,
  AudioContent,
  VideoContent,
} from '../../types';

/** Origem gravada em cada envio feito pelo CRM. */
export const UAZAPI_TRACK_SOURCE_CRM = 'crm';

export interface UazapiCredentials {
  /** Endereço da instância, ex.: https://suaempresa.uazapi.com */
  baseUrl: string;
  /** Token da instância */
  token: string;
}

interface UazapiSendResponse {
  id?: string;
  messageid?: string;
  status?: string;
  error?: string | boolean;
  message?: string;
}

export class UazapiWhatsAppProvider extends BaseChannelProvider {
  readonly channelType: ChannelType = 'whatsapp';
  readonly providerName = 'uazapi';

  private baseUrl = '';
  private token = '';

  async initialize(config: ProviderConfig): Promise<void> {
    await super.initialize(config);
    const credentials = config.credentials as unknown as UazapiCredentials;
    this.baseUrl = String(credentials.baseUrl || '').trim().replace(/\/+$/, '');
    this.token = String(credentials.token || '').trim();
    this.log('info', 'uazapi provider initialized', { baseUrl: this.baseUrl });
  }

  async getStatus(): Promise<ConnectionStatusResult> {
    try {
      const response = await this.request<Record<string, unknown>>('GET', '/instance/status');
      const texto = JSON.stringify(response).toLowerCase();
      if (texto.includes('"connected"') || texto.includes('"status":"open"')) {
        return { status: 'connected', message: 'Conectado ao WhatsApp' };
      }
      if (texto.includes('connecting')) {
        return { status: 'connecting', message: 'Conectando ao WhatsApp' };
      }
      return { status: 'disconnected', message: 'Instância desconectada na uazapi', details: response };
    } catch (error) {
      return { status: 'error', message: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    const { to, content, conversationId } = params;
    const number = String(to || '').replace(/@.*$/, '').replace(/\D/g, '');
    const marca = { track_source: UAZAPI_TRACK_SOURCE_CRM, track_id: conversationId };

    try {
      let response: UazapiSendResponse;
      switch (content.type) {
        case 'text':
          response = await this.request('POST', '/send/text', {
            number,
            text: (content as TextContent).text,
            ...marca,
          });
          break;
        case 'image':
        case 'video':
        case 'audio':
        case 'document': {
          const media = content as ImageContent | VideoContent | AudioContent | DocumentContent;
          const body: Record<string, unknown> = {
            number,
            type: content.type,
            file: media.mediaUrl,
            ...marca,
          };
          if ('caption' in media && media.caption) body.text = media.caption;
          if (content.type === 'document') body.docName = (media as DocumentContent).fileName;
          response = await this.request('POST', '/send/media', body);
          break;
        }
        default:
          return {
            success: false,
            error: { code: 'UNSUPPORTED_CONTENT', message: `Tipo "${content.type}" ainda não é enviado pela uazapi` },
          };
      }

      if (response.error) {
        return { success: false, error: { code: 'SEND_FAILED', message: String(response.message || response.error) } };
      }

      return {
        success: true,
        externalMessageId: response.messageid || response.id,
        status: 'sent',
        raw: response,
      };
    } catch (error) {
      this.log('error', 'Falha ao enviar pela uazapi', { error: error instanceof Error ? error.message : error, contentType: content.type });
      return {
        success: false,
        error: { code: 'REQUEST_FAILED', message: error instanceof Error ? error.message : 'Erro desconhecido' },
      };
    }
  }

  /**
   * Os eventos da uazapi não chegam por aqui: o n8n recebe e repassa para a
   * rota `/api/public/v1/whatsapp`, que grava a conversa.
   */
  async handleWebhook(payload: unknown): Promise<WebhookHandlerResult> {
    const errorData: ErrorEvent = {
      type: 'error',
      code: 'NOT_SUPPORTED',
      message: 'Eventos da uazapi chegam pelo n8n em /api/public/v1/whatsapp',
      timestamp: new Date(),
    };
    return { type: 'error', data: errorData, raw: payload };
  }

  validateConfig(config: ProviderConfig): ValidationResult {
    const baseResult = super.validateConfig(config);
    if (!baseResult.valid) return baseResult;

    const errors: ValidationError[] = [];
    const credentials = config.credentials as unknown as UazapiCredentials;
    try {
      const url = new URL(String(credentials.baseUrl || ''));
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocolo');
    } catch {
      errors.push({ field: 'credentials.baseUrl', message: 'Informe o endereço da instância, começando com https://', code: 'INVALID_URL' });
    }
    if (!credentials.token) {
      errors.push({ field: 'credentials.token', message: 'Informe o token da instância', code: 'REQUIRED' });
    }
    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  private async request<T>(method: 'GET' | 'POST', endpoint: string, body?: Record<string, unknown>): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', token: this.token },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    const text = await response.text();
    if (!response.ok) throw new Error(`uazapi ${response.status}: ${text.slice(0, 200)}`);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`uazapi devolveu resposta não-JSON em ${endpoint}: ${text.slice(0, 200)}`);
    }
  }
}

export default UazapiWhatsAppProvider;
