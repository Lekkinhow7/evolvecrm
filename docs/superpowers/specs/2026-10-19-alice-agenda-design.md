# Agenda completa do CRM da Alice Teixeira

Data: 19/10/2026 · Branch de trabalho: `alice-design-system` (publica em `alice-teixeira`)

## Por quê

Os leads da Alice chegam por tráfego pago, pelo WhatsApp e pelo formulário do site. Uma IA de qualificação (ainda **não construída**) vai conversar com eles, pedir documentos para análise e agendar a reunião com a Alice. Tudo isso tem que aparecer na Agenda e no CRM, ligado ao contato e ao negócio, sem ninguém digitar de novo.

## Decisões do dono (Alex), como foram tomadas

1. **Os slots de horário moram no banco (Supabase do agente), não no CRM.** A IA consulta os horários livres lá e reserva lá. O CRM **reflete** o que o banco e a IA mandam; não guarda, não calcula e não edita slots. É o mesmo modelo da SucçãoZero.
2. **O termo é "reunião agendada"**, não "consulta agendada".
3. **Lembretes ao cliente ficam no n8n**: um dia antes e 45 minutos antes da reunião. O CRM não manda lembrete.
4. **Os documentos podem ser analisados antes da reunião**: muitas vezes a análise vem antes da reunião de fechamento.
5. **O funil tem que permitir adicionar, remover e reordenar colunas** (e criar funil novo), para ajustar depois de conversar com a Alice.
6. **"Proposta de honorários" entra como etapa** (sugestão aceita pelo Alex, que vai validar com a Alice e pode remover).
7. **Copiar o modelo da SucçãoZero** para tudo que envolve horário (confirmado pelo Alex depois de ver como é lá):
   - o banco do agente manda em horários e ocupação;
   - o Google Agenda é só espelho, escrito pelo n8n e nunca lido para saber o que está ocupado;
   - a equipe marca pelo CRM, mas o CRM pergunta ao n8n e é o n8n que grava no banco e no Google;
   - o CRM avisa o n8n pelo mesmo canal para as outras ações (como "Pedir mais documentos").

## Objetivos

- Reunião marcada pela IA aparece sozinha na Agenda, ligada ao contato e ao negócio, e o negócio vai para "Reunião agendada".
- Remarcar ou cancelar na conversa atualiza a mesma reunião (sem duplicar).
- Documentos enviados pelo cliente ficam anexados ao negócio, com tarefa de análise para a Alice.
- A Alice decide o caminho do negócio depois da análise com um clique.
- Funil reordenado e fácil de mudar.

## Não objetivos (fora deste projeto)

- Construir a IA de qualificação, o banco do agente (tabelas de slots e agendamentos) e os fluxos do n8n. Este projeto entrega o lado do CRM (as portas de entrada e o canal de saída para o n8n) e documenta o contrato para quem montar o n8n.
- Tabela de slots, rodízio ou disponibilidade dentro do CRM.
- Lembretes ao cliente (n8n). Opcional futuro: o n8n avisa o CRM que mandou, e a reunião mostra "lembrete enviado".
- O CRM falar direto com o Google Agenda. Quem cria, muda e apaga eventos no Google é o n8n (como na SucçãoZero).
- Reuniões marcadas direto no Google Agenda bloquearem horário: não bloqueiam (igual à SucçãoZero). A regra é marcar sempre pela IA ou pelo CRM.

## Anti-objetivos (seria fracasso mesmo funcionando)

- O CRM virar uma segunda fonte de horários (duas verdades sobre o que está livre).
- A mesma reunião aparecer duas vezes depois de remarcada.
- A equipe ter que copiar à mão o que a IA já combinou na conversa.
- Etapas do funil presas no código (nomes fixos que impedem a Alice de mudar o funil).

## Funil proposto (funil "Atendimento", chave `alice`)

Hoje: Novo lead → Em atendimento → Consulta agendada → Análise de documentos → Proposta de honorários → Contratou / Não contratou.

Proposto:

| # | Etapa | Vira (estágio do contato) | Entra quando |
|---|---|---|---|
| 1 | Novo lead | Lead | chega pelo site/WhatsApp (já acontece via `/api/site-lead` e mensageria) |
| 2 | Em atendimento | Lead | a IA (ou a equipe) está conversando |
| 3 | Análise de documentos | MQL | o cliente mandou documentos (porta de documentos) |
| 4 | Reunião agendada | MQL | a IA reservou um slot (porta de agendamento) |
| 5 | Proposta de honorários | Oportunidade | a Alice envia a proposta depois da reunião e preenche o valor dos honorários no negócio |
| 6 | Contratou | Cliente | proposta aceita/assinada |
| 7 | Não contratou | Outros / Perdidos | desistiu ou caso inviável (com motivo) |

Atalhos esperados (feitos pelas portas e pelos botões, além do arrastar livre do Kanban):
- Sem documentos: Em atendimento → Reunião agendada.
- Caso inviável na análise: Análise de documentos → Não contratou.
- Faltam documentos: continua em Análise, marcado "aguardando documentos".

**Como aplicar a mudança no funil:** pela tela que já existe (engrenagem "Configurar funil": renomear "Consulta agendada" para "Reunião agendada" e arrastar "Análise de documentos" para antes dela). É configuração, não código; os negócios que já estão nas etapas continuam nelas.

**Regra para o código:** nenhuma porta pode depender do nome ou da posição da etapa. Ver "Como as portas acham a etapa".

## Como as portas acham a etapa

As portas precisam mover o negócio para "Reunião agendada", "Análise de documentos" etc., mas a Alice pode renomear e reordenar. Decisão do builder dentro destas regras:
- A etapa de destino vem da **configuração do funil**, não de texto fixo no código. Sugestão (chamada do Claude): um campo opcional "Papel da etapa" na tela Configurar funil, com valores `reuniao_agendada` e `analise_documentos` (e nenhum ou vazio nas demais). As portas procuram a etapa pelo papel dentro do funil do negócio.
- Se o funil não tiver etapa com aquele papel, a porta registra a reunião/documentos normalmente e **não move** o negócio (e devolve um aviso na resposta).

## Porta de agendamento (CRM ← IA/n8n)

Reaproveitar o desenho da SucçãoZero (`main`: `app/api/public/v1/visitas/route.ts` e `lib/visits/agendar.ts`, tipo `reuniao`), **sem** técnico, laudo, formulários e fila de avisos, que não se aplicam à Alice. O código da SucçãoZero não está no branch da Alice; trazer só o necessário.

`POST /api/public/v1/reunioes`, autenticada pela chave da API pública que já existe (`lib/public-api/auth.ts`).

Corpo:
- `phone` ou `deal_id` (obrigatório um dos dois, exceto em cancelamento)
- `name` (opcional)
- `starts_at` (obrigatório), `ends_at` ou `duration_minutes` (padrão 60)
- `external_ref` (**obrigatório**): id do slot/reserva no banco do agente. É a chave que impede duplicar.
- `format`: `online` | `presencial` (opcional), `meeting_url` (online), `address` (presencial)
- `description`: resumo do que a IA coletou na conversa
- `cancelada: true` (com `external_ref`) para cancelar

Comportamento:
- Acha o negócio aberto do cliente (por `deal_id` ou pelo telefone); se não existir, cria contato e negócio no funil `alice`, na primeira etapa.
- Cria ou atualiza (pelo `external_ref`) uma atividade `MEETING` com data, fim, formato, link/endereço, descrição e origem (`origem`: `ia` ou `equipe`, enviada pelo n8n; padrão `ia`).
- Move o negócio para a etapa de papel `reuniao_agendada` (se existir), registrando a mudança como hoje.
- Remarcar = mesmo `external_ref`, outra data: atualiza a mesma reunião.
- Cancelar: marca a reunião como cancelada (não apaga) e **não** move o negócio de volta (a equipe decide).
- Resposta: ids da reunião, do negócio e do contato, se reaproveitou e avisos.

Banco (migration idempotente, `ADD COLUMN IF NOT EXISTS`) em `activities`: `ends_at`, `external_ref` (único por organização quando preenchido), `meeting_status` (`agendada`, `realizada`, `cancelada`, `nao_compareceu`), `meeting_format`, `meeting_url`, `address`, `source`. Se o builder preferir, pode reusar os nomes da SucçãoZero (`visit_status` etc.) para as duas bases convergirem; a decisão é dele, desde que a migration rode nas duas.

## Canal de saída para o n8n (CRM → n8n)

Copiar `lib/calls/n8n.ts` da SucçãoZero (`main`): uma função que faz `POST` num endereço do n8n com `{ acao, ...dados }`, cabeçalho de segredo, limite de 15 segundos e erro claro quando o n8n não responde ou não está configurado. Variáveis próprias da Alice (nomes a critério do builder, por exemplo `N8N_AGENDA_URL` e `N8N_RETORNO_SECRET`).

Ações:

| Ação | Quando | O n8n faz | Responde |
|---|---|---|---|
| `horarios_livres` | a equipe abre "Nova reunião" | lê slots e agendamentos no banco | lista de horários livres (início, fim, formato) |
| `agendar_reuniao` | a equipe confirma o horário | confere de novo se está livre, grava no banco, cria o evento no Google (com Meet se online) | id do agendamento (vira o `external_ref`), link, ou "horário ocupado" |
| `remarcar_reuniao` / `cancelar_reuniao` | a equipe remarca ou cancela pelo CRM | atualiza o banco e o Google | confirmação |
| `pedir_documentos` | a Alice clica "Pedir mais documentos" | pede ao cliente pelo WhatsApp (IA ou mensagem pronta) | confirmação |

Depois que o n8n grava, a reunião chega ao CRM pela **porta de agendamento** (abaixo), como as marcadas pela IA, para existir um caminho só. O CRM pode já mostrar a reunião com o que o n8n respondeu; a porta chega depois com o mesmo `external_ref` e só atualiza.

**Como as mudanças do banco chegam ao CRM:** na SucçãoZero, um fluxo do n8n roda a cada minuto, pega o que mudou no banco e chama a API do CRM. Para a Alice vale o mesmo (a cada minuto, ou logo depois de cada reserva, a critério de quem montar o n8n). O CRM não depende de qual dos dois: a porta aceita repetição sem duplicar.

## Porta de documentos (CRM ← IA/n8n)

`POST /api/public/v1/documentos`, mesma autenticação.

Corpo:
- `phone` ou `deal_id`
- `files`: lista de `{ url, file_name, mime_type }` (o n8n baixa do WhatsApp e manda o link) **ou** envio multipart; decisão do builder conforme o que for mais simples para o n8n.
- `external_ref` por arquivo (opcional) para não anexar o mesmo arquivo duas vezes.
- `note` (opcional): o que o cliente disse sobre os documentos.

Comportamento:
- Guarda os arquivos no bucket `deal-files` e registra em `deal_files` (já existem).
- Move o negócio para a etapa de papel `analise_documentos` (se existir).
- Cria uma tarefa "Analisar documentos de {nome}" para a Alice (responsável: dono do negócio, ou o admin), com prazo de 2 dias úteis (chamada do Claude; ajustável).
- Se o negócio estava "aguardando documentos", tira essa marca.

## O que a Alice vê no CRM

**Agenda (`/agenda`):**
- Reuniões vindas da IA aparecem no calendário com formato (online/presencial), link ou endereço, cliente e negócio, e situação (agendada, realizada, cancelada, não compareceu).
- Abrir a reunião mostra o resumo da IA e o atalho para o negócio e para a conversa.
- Reunião cancelada aparece riscada (não some), para histórico.
- A equipe marca reunião pelo "+ Novo → Nova reunião" (e pelo negócio), mas **escolhendo entre os horários livres que o n8n devolve** (ação `horarios_livres`). Ao confirmar, o CRM pede ao n8n `agendar_reuniao`; só depois que o n8n responde que gravou no banco (e no Google), a reunião aparece no CRM. Se o n8n não responder, nada é gravado e a tela avisa para tentar de novo (igual à ficha da call da SucçãoZero). Remarcar e cancelar pelo CRM seguem o mesmo caminho (`remarcar_reuniao`, `cancelar_reuniao`).
- Tarefas, ligações e anotações que não ocupam horário da Alice continuam sendo criadas direto no CRM, como hoje.

**Kanban e negócio:**
- Card com selo "N documentos" quando há anexos, e selo "Aguardando documentos" quando marcado.
- Na janela do negócio, uma aba **Documentos** (lista, ver, baixar), reaproveitando o componente de arquivos que já existe no painel de foco (`useDealFiles`).
- Três botões no negócio em "Análise de documentos": **Seguir para reunião** (vai para a etapa de papel `reuniao_agendada`; a reunião em si é marcada pela IA/equipe), **Pedir mais documentos** (marca "aguardando documentos"; o CRM chama a ação `pedir_documentos` do n8n, que pede ao cliente), **Não seguir** (vai para "Não contratou" pedindo o motivo, fluxo de perda que já existe).
- Em "Proposta de honorários", o campo **valor** do negócio fica em destaque (é o valor dos honorários), porque é ele que alimenta "Valor em negociação" e "Receita ganha".

**Funil mais fácil de mudar:**
- Coluna "+ Nova etapa" no fim do Kanban (abre a criação de etapa direto).
- "Novo funil" visível no seletor de funil.
- A janela "Editar Board" vira "Configurar funil", em português e no visual do design system, com o campo "Papel da etapa".

## Restrições

- Next.js 16, Supabase, regras do `CLAUDE.md` (filtrar por `organization_id`, `maybeSingle`, migrations idempotentes, `board_stages` com coluna `"order"`).
- Design system da Alice (`@/design-system`) em toda tela nova ou tocada.
- Portas seguem o padrão da API pública existente (chave, erros `VALIDATION_ERROR` 422, respostas JSON).
- Fuso `America/Sao_Paulo` para datas exibidas.
- Publicar só com aprovação do Alex (push em `alice-teixeira` + Implantar no EasyPanel).

## Deixado para o builder

- Nomes exatos das colunas novas e se convergem com os da SucçãoZero.
- Formato do envio de arquivos (link vs multipart).
- Visual exato da aba Documentos e dos selos, dentro do design system.
- Testes: unitários das portas (criar, remarcar sem duplicar, cancelar, sem etapa com papel) e da busca de etapa por papel.

## Decisões do Claude depois da revisão (o Alex pode revisar)

1. **As portas só fazem o negócio avançar.** Se o negócio já está numa etapa igual ou mais adiantada (pela ordem do funil) que a de destino, a porta registra a reunião/documentos e não move. Negócio ganho ou perdido nunca é reaberto nem movido: a porta registra e devolve um aviso.
2. **Busca do negócio:** procura negócio aberto do contato em qualquer funil da organização (como a SucçãoZero); se houver mais de um, o mais recente. Negócio novo é criado no funil cuja chave está em `SITE_LEAD_BOARD_KEY` (a Alice usa `alice`), a mesma variável do formulário do site.
3. **"Realizada" e "não compareceu":** a Alice marca na própria reunião, na Agenda. A porta de agendamento também aceita `status` (`realizada`, `nao_compareceu`) para o n8n informar. Marcar "realizada" não move o negócio: a Alice move para "Proposta de honorários" quando enviar a proposta.
4. **Convergência com a SucçãoZero:** são projetos Supabase separados. As colunas novas em `activities` reaproveitam os nomes que a SucçãoZero já usa quando o significado é o mesmo (`ends_at`, `external_ref`, `address`), com `IF NOT EXISTS`, para os dois bancos poderem convergir sem quebrar nada. Não trazer técnico, laudo, formulários nem fila de avisos.
5. **Arquivos:** aceitar PDF, imagens (JPG, PNG, HEIC) e Word até 25 MB por arquivo (subir o limite do bucket `deal-files`). Outros tipos ou maiores: recusar aquele arquivo com erro claro na resposta, sem derrubar os demais.

## Dúvidas abertas

Nenhuma. As duas que ficaram da revisão (reunião marcada pela equipe e "Pedir mais documentos") foram respondidas pelo Alex: copiar o modelo da SucçãoZero (decisão 7 e "Canal de saída para o n8n").
