# Fonte oficial comercial — Sucção Zero

- Fonte oficial: Supabase conectado ao deploy do CRM Sucção Zero.
- Modelo canônico: tabelas `public.succaozero_*`.
- Projeção temporária de UI: `contacts`, `deals` e `activities` no mesmo banco.
- Banco do agente: origem de migração e de eventos durante a transição; não é segunda fonte oficial.
- Alice: projeto e deploy independentes; não recebe migrations Sucção Zero nem ativa a feature flag.
- Corte: somente após dry-run, conciliação, backup restaurável e aceite do piloto.

## Autoridade por campo na Fase 1

| Campo | Autoridade |
|---|---|
| Identidade comercial | Serviço canônico de entrada do CRM Sucção Zero |
| Etapa e responsável | Serviço comercial do CRM Sucção Zero |
| Próxima ação | CRM, vendedor responsável ou automação autorizada |
| Agenda, laudo e instalação | Banco atual do agente até a Fase 2 |
| Proposta e recebimento | Sistemas de origem até a Fase 3 |

Alterações humanas confirmadas têm precedência sobre inferências automáticas. Site, IA e n8n enviam eventos às mesmas interfaces controladas; nenhum deles escreve diretamente nas projeções genéricas.

## Isolamento e ativação

A ativação exige simultaneamente a feature flag, o ID da organização Sucção Zero e o project ref esperado. Scripts operacionais validam o hostname da conexão antes de qualquer escrita. Uma divergência encerra a operação com erro, impedindo que as migrations específicas sejam aplicadas ao CRM da Alice.

As migrations Sucção Zero ficam fora da sequência genérica de `supabase/migrations`. Elas são executadas somente pelo aplicador específico, com confirmação explícita do project ref em produção.

## Critério de corte

O corte para a fonte oficial exige backup restaurado e conferido, migração dry-run sem escrita, conciliação sem divergências, testes do rodízio com dois vendedores e um terceiro simulado, recuperação de interrupção do n8n e regressão do CRM Alice. A reversão desliga a feature flag e preserva eventos ocorridos após o corte para reconciliação; não apaga tabelas nem histórico.
