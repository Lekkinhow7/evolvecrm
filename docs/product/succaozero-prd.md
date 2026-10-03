# PRD final — CRM e operação comercial Sucção Zero

Versão 2.0 — 3 de outubro de 2026

## Objetivo

Centralizar a jornada entre site, WhatsApp, IA, vendedores e operação técnica, com isolamento absoluto em relação à Alice Advogada. O CRM deve acompanhar cada oportunidade desde a entrada até venda, visita, instalação e pós-venda, mantendo responsável, próxima ação, evidências e histórico.

## Princípios aprovados

- Reaproveitar o CRM existente.
- Dados canônicos da Sucção Zero usam tabelas `succaozero_*`; tabelas compartilhadas recebem sempre `organization_id`.
- Alice e Sucção Zero permanecem em projetos Supabase distintos e nenhum rollout pode alterar Alice como efeito colateral.
- Rodízio configurável, inicialmente com dois vendedores, sem limite fixo.
- Pausar, reordenar ou incluir vendedor afeta apenas oportunidades novas; transferências são explícitas e auditadas.
- IA pode qualificar, registrar contexto, criar próxima ação e solicitar mudança de etapa. Não pode inventar agendamento, visita concluída, venda, pagamento ou laudo.

## Pessoas e permissões

| Papel | Escopo |
| --- | --- |
| Gestor/admin | Visão consolidada, configuração do rodízio, transferências e exceções |
| Vendedor | Carteira atribuída, atividades, próxima ação e conversa assumida |
| Técnico | Agenda e execução técnica atribuídas; sem autoridade comercial automática |
| IA/integração | API restrita, idempotente e auditada |

Até decisão explícita do gestor, vendedor não recebe acesso ampliado à carteira do colega.

## Modelo canônico

- Contato: pessoa e identidades de comunicação.
- Cliente: contratante, separado de contato e de local.
- Local: endereço e condições de execução.
- Piscina: unidade técnica do local, com avaliações e fotos próprias.
- Oportunidade: negociação, etapa, vendedor, valor e escopo.
- Próxima ação: executor, tipo e prazo ou exceção justificada.
- Agendamento: reserva técnica com equipe, duração, estado e proteção de concorrência.
- Evento comercial: trilha imutável de autoria, estado anterior/novo, horário e evidência.

## Requisitos da Fase 1

1. Entrada de site, agente e n8n usa evento permanente e deduplicado.
2. Rodízio é atômico, persistente e funciona com dois ou mais vendedores.
3. Oportunidade existente mantém responsável; repetição não avança a fila.
4. Sem vendedor elegível, lead é preservado e sinalizado.
5. Todo negócio aberto tem próxima ação ou exceção.
6. Inbox separa Hoje, Atrasadas e Sem próxima ação.
7. Mudança repetida de etapa não reinicia a data; eventos antigos não sobrescrevem estado novo.
8. Identificador `@lid` fica pendente para resolução, nunca é descartado.
9. IDs de outra organização são rejeitados em todas as entradas administrativas e públicas.
10. Sincronização usa checkpoint persistente e fila de reprocessamento, não janela móvel.

## Dashboard comercial

O dashboard deve apresentar números agregados no servidor, sem teto de mil registros, com período e filtros visíveis:

- novos leads e oportunidades;
- carteira aberta atual;
- vendas ganhas por data de fechamento;
- conversão de ganhos sobre ganhos + perdidos;
- ciclo de venda entre criação e fechamento;
- atribuições automáticas, transferências e exceções por vendedor;
- ações de hoje, atrasadas e ausentes;
- origem, campanha e região;
- comparecimento e prazo de laudo quando a Fase 2 estiver ativa.

Cada indicador deve permitir conferir os registros componentes. Dado ausente é “não informado”, nunca zero inventado.

## Agenda

O calendário visual existente será reaproveitado. Tarefas comerciais e reservas técnicas permanecem distinguíveis. Reservas usam datas tipadas, fuso `America/Sao_Paulo`, equipe, duração, capacidade, deslocamento e estados agendado/confirmado/em atendimento/concluído/cancelado/não compareceu. A ativação automática depende dos horários, equipes e durações fornecidos pelo proprietário.

## Integração e IA

Endpoint oficial: `POST /api/public/v1/succaozero/events`.

Eventos aceitos: `lead.received`, `lead.qualified`, `stage.change_requested` e `next_action.requested`. A IA só confirma ao cliente depois de retorno bem-sucedido. Atendimento humano pausa a IA; retomada deve ser explícita e registrada. Follow-up automático depende de política comercial aprovada.

## Estado de implementação

| Entrega | Estado |
| --- | --- |
| Fonte oficial, schema canônico e RLS | Implementado e verificado no CRM Sucção Zero |
| Correção das FKs do agente | Implementada e verificada |
| Rodízio atômico e configurável | Implementado; teste de carga real aguarda homologação |
| Entrada canônica e formulário do site | Implementados no código; aguardam deploy/configuração |
| API de eventos para IA/n8n | Implementada; aguarda API key e corte controlado |
| Painel administrativo do rodízio | Implementado no código |
| Próximas ações no Inbox | Implementado no código |
| Migração dry-run e conciliação | Ferramentas prontas; execução depende das URLs dos bancos e backup |
| Runbook n8n e verificador de saúde | Prontos; mudança do workflow depende de acesso ao n8n |
| Release gate e verificação de restauração | Prontos; gates externos dependem de homologação, backup e fingerprint Alice |
| Agenda técnica integrada | Fase 2; depende de regras operacionais |
| Propostas, recebimentos e pós-venda | Fase 3; depende de regras e modelos aprovados |
| Dashboard executivo completo | Fase 4; depende da qualidade/migração da base e definições de metas |

## Critérios de aceite principais

- A/B/A/B com dois vendedores e sequência configurada após incluir C.
- Entradas simultâneas recebem posições sucessivas.
- Evento repetido não duplica card nem altera responsável.
- Pausa/reativação não redistribui carteira existente.
- Lead sem vendedor e `@lid` permanecem recuperáveis.
- Oportunidade aberta aparece com ação, atraso ou exceção.
- Mudança antiga não sobrescreve mudança manual mais recente.
- Interrupção de 30 minutos é recuperada sem perda.
- Sucção Zero não lê nem grava dados Alice; fingerprint Alice permanece igual.

## Dependências do proprietário

1. Fornecer/autorizar homologação isolada e backup restaurado para testes concorrentes e de recuperação.
2. Informar contas e ordem inicial dos vendedores e política para a fila sem responsável.
3. Confirmar se vendedores veem somente a própria carteira ou também a do colega.
4. Disponibilizar acesso ao n8n e API key Sucção Zero para o corte em modo sombra.
5. Aprovar horários, frequência e limite de follow-up da IA.
6. Definir equipes, horários, durações e deslocamentos para a agenda técnica.
7. Definir evidência de venda ganha, descontos, recebimentos e modelos de proposta/laudo.
8. Autorizar deploy exclusivo Sucção Zero e confirmar que o deploy Alice não compartilha a mesma configuração.

## Fora do escopo sem nova aprovação

Excluir dados de produção, renomear tabelas em massa, ativar disparos automáticos, publicar mudanças na Alice, integrar calendário externo ou executar testes com clientes reais.
