'use client';

/**
 * @fileoverview Cadastro da equipe técnica.
 *
 * É daqui que o agendamento automático tira quem vai na visita e para qual
 * WhatsApp manda os lembretes. Sem ninguém ativo aqui, a visita é criada sem
 * responsável e nenhum aviso é programado.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, UserPlus } from 'lucide-react';

import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase/client';

interface Tecnico {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  position: number;
}

const campo =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary-500 dark:border-white/10 dark:bg-white/5 dark:text-white';

export function EquipeTecnica() {
  const { showToast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [equipe, setEquipe] = useState<Tecnico[]>([]);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('technicians')
      .select('id, name, phone, active, position')
      .order('position', { ascending: true });
    setEquipe((data || []) as Tecnico[]);
  }, []);

  useEffect(() => {
    if (aberto) void carregar();
  }, [aberto, carregar]);

  const adicionar = async () => {
    if (!supabase || !nome.trim() || !telefone.trim()) return;
    setSalvando(true);
    const { data: perfil } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
      .single();
    const { error } = await supabase.from('technicians').insert({
      organization_id: (perfil as { organization_id?: string } | null)?.organization_id,
      name: nome.trim(),
      phone: telefone.trim(),
      position: equipe.length,
    });
    setSalvando(false);
    if (error) {
      showToast(String(error.message).includes('duplicate') ? 'Esse WhatsApp já está cadastrado' : 'Não foi possível salvar', 'error');
      return;
    }
    setNome('');
    setTelefone('');
    void carregar();
  };

  const alternar = async (t: Tecnico) => {
    if (!supabase) return;
    await supabase.from('technicians').update({ active: !t.active }).eq('id', t.id);
    void carregar();
  };

  const remover = async (t: Tecnico) => {
    if (!supabase || !window.confirm(`Remover ${t.name} da equipe?`)) return;
    await supabase.from('technicians').delete().eq('id', t.id);
    void carregar();
  };

  return (
    <section className="mb-4 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <button
        onClick={() => setAberto((a) => !a)}
        className="flex w-full items-center gap-2 px-5 py-3 text-left"
      >
        {aberto ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        <span className="font-semibold text-slate-900 text-sm dark:text-white">Equipe técnica</span>
        <span className="text-slate-500 text-xs">
          quem recebe as visitas e os lembretes no WhatsApp
        </span>
      </button>

      {aberto && (
        <div className="space-y-4 border-slate-200 border-t px-5 py-4 dark:border-white/10">
          <div className="flex flex-wrap gap-2">
            <input className={`${campo} min-w-[180px] flex-1`} placeholder="Nome do técnico" value={nome} onChange={(e) => setNome(e.target.value)} />
            <input className={`${campo} min-w-[180px] flex-1`} placeholder="WhatsApp com DDD" value={telefone} onChange={(e) => setTelefone(e.target.value)} inputMode="tel" />
            <button
              onClick={adicionar}
              disabled={salvando || !nome.trim() || !telefone.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 font-medium text-sm text-white disabled:opacity-50"
            >
              <UserPlus size={15} /> Adicionar
            </button>
          </div>

          {equipe.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Nenhum técnico cadastrado. Enquanto estiver assim, a visita agendada pela IA entra no calendário sem responsável e sem aviso no WhatsApp.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-white/5">
              {equipe.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-slate-900 text-sm dark:text-white">{t.name}</span>
                    <span className="block text-slate-500 text-xs">{t.phone}</span>
                  </span>
                  <button
                    onClick={() => alternar(t)}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      t.active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-white/10'
                    }`}
                  >
                    {t.active ? 'recebendo visitas' : 'pausado'}
                  </button>
                  <button onClick={() => remover(t)} className="text-slate-400 hover:text-red-600" aria-label="Remover">
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="text-slate-500 text-xs">
            As visitas são distribuídas em rodízio entre quem está recebendo visitas, na ordem desta lista.
          </p>
        </div>
      )}
    </section>
  );
}
