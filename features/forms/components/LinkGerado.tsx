'use client';

/**
 * @fileoverview Link de formulário recém gerado.
 *
 * Mostra o endereço num campo que dá para selecionar com a mão, copia com
 * reserva para quando o navegador bloqueia a área de transferência, e abre o
 * WhatsApp com a mensagem pronta para o técnico ou o vendedor.
 */

import React, { useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';

const campo =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white';

/** Copiar falha em parte dos navegadores sem gesto recente; aí vai pelo modo antigo. */
async function copiar(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // cai para o modo antigo
  }
  try {
    const area = document.createElement('textarea');
    area.value = texto;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Deixa o número no formato que o WhatsApp aceita, com o 55 e o nono dígito. */
export function normalizarWhatsapp(bruto: string): string | null {
  const digitos = (bruto || '').replace(/\D/g, '');
  if (!digitos) return null;
  let n = digitos;
  if (!n.startsWith('55')) n = `55${n}`;
  const corpo = n.slice(2);
  if (corpo.length === 10 && /^[6-9]/.test(corpo.slice(2, 3))) {
    // celular antigo sem o nono dígito
    return `55${corpo.slice(0, 2)}9${corpo.slice(2)}`;
  }
  if (corpo.length < 10 || corpo.length > 11) return null;
  return n;
}

export function LinkGerado({
  url,
  nomeFormulario,
  contexto,
  telefonePadrao,
}: {
  url: string;
  nomeFormulario: string;
  contexto?: string;
  telefonePadrao?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  const [telefone, setTelefone] = useState(telefonePadrao || '');
  const [aviso, setAviso] = useState<string | null>(null);

  const mensagem = [
    `Oi! Segue o formulário *${nomeFormulario}*${contexto ? ` de ${contexto}` : ''}.`,
    '',
    'É só abrir e preencher pelo celular:',
    url,
    '',
    'O link vale por 7 dias.',
  ].join('\n');

  const aoCopiar = async () => {
    const ok = await copiar(url);
    setCopiado(ok);
    setAviso(ok ? null : 'Não consegui copiar. Selecione o endereço acima e copie com Ctrl+C.');
    if (ok) setTimeout(() => setCopiado(false), 2500);
  };

  const aoEnviar = () => {
    const numero = normalizarWhatsapp(telefone);
    if (!numero) {
      setAviso('Informe o WhatsApp com DDD, por exemplo 19 99999 9999.');
      return;
    }
    setAviso(null);
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
  };

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
      <p className="font-medium text-slate-700 text-xs dark:text-slate-200">Link do formulário</p>

      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className={`${campo} font-mono text-xs`}
          aria-label="Endereço do formulário"
        />
        <button
          type="button"
          onClick={aoCopiar}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 text-sm dark:border-white/10 dark:text-slate-200"
        >
          {copiado ? <Check size={15} /> : <Copy size={15} />}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="WhatsApp de quem vai preencher, com DDD"
          className={`${campo} min-w-[220px] flex-1`}
          inputMode="tel"
        />
        <button
          type="button"
          onClick={aoEnviar}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 font-medium text-sm text-white hover:bg-emerald-700"
        >
          <MessageCircle size={15} /> Enviar no WhatsApp
        </button>
      </div>

      {aviso && <p className="text-amber-700 text-xs dark:text-amber-400">{aviso}</p>}
      <p className="text-slate-500 text-xs">
        O WhatsApp abre com a mensagem pronta. Você só confere e aperta enviar.
      </p>
    </div>
  );
}
