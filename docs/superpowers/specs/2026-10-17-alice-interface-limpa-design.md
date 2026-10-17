# CRM da Alice — interface limpa (sem "cara de IA")

**Data:** 17/10/2026 · **Branch:** `alice-design-system` (publica via `alice-teixeira`)
**Protótipo aprovado:** [`2026-10-17-alice-interface-limpa/prototipo.html`](2026-10-17-alice-interface-limpa/prototipo.html). Abra direto do disco; use `?light`/`?dark` e `&p=visao|contatos|negocios`, ex.: `prototipo.html?light&p=contatos`.

## Intenção

O CRM da Alice já está com o design system dela (cores, Onest, cantos, botões), mas ainda "parece feito por IA". O dono comparou com o GoViq (`app.goviq.com.br`), que parece obra de um engenheiro de software sênior, e quer **a mesma limpeza e disciplina, mantendo o design system da Alice**.

A cara de IA vem de enfeites e de falta de padrão nas telas, não da paleta:
- grade de pontos no fundo, manchas coloridas desfocadas e vidro em todo lugar;
- sombras fortes e degradês fora dos lugares previstos;
- ícones dentro de bolinhas de cores diferentes, 5 cores nas colunas do Board;
- negrito pesado, texto de 10–11px e caixa alta espalhada;
- termos em inglês ("Deals", "Churn", "LTV", "Boards"), valores em dólar e logo "S" da SucçãoZero;
- cada tela com um cabeçalho diferente.

## Objetivos

1. Toda tela autenticada fica com cara de produto profissional, seguindo as regras abaixo e o protótipo.
2. O design system da Alice continua sendo a fonte da verdade (`DESIGN.md` + `design-system/`). A única mudança nele é a dos números (ver "Decisões tomadas").
3. As telas passam a usar a mesma "planta" e, onde houver equivalente, os componentes de `@/design-system`.

## Não objetivos

- Não muda funcionalidade, dado, rota, permissão, integração nem fluxo. Só a camada visual e os textos de interface.
- Não cria telas novas nem remove recursos.
- Não mexe no CRM da SucçãoZero (`main`). Levar para lá é outro projeto.

## Anti-objetivos (seria um fracasso mesmo funcionando)

- **Copiar o GoViq:** a paleta marinho/coral, a fonte DM Sans/Poppins ou o visual dark-first dele. Do GoViq vem só a disciplina; o visual é o da Alice. Esse erro já aconteceu no primeiro protótipo e foi recusado.
- Trocar ou "achatar" o design system da Alice: tirar o vidro da sidebar, os cards de KPI ink/cyan/lime, os botões pílula, os cantos de 24px ou o fundo mist.
- Quebrar qualquer comportamento existente (drag-and-drop do Board, inbox, filtros, modais).

## Decisões tomadas pelo dono

- **Base visual:** o design system da Alice inteiro, como no protótipo 2: sidebar de vidro com acesso rápido e grupos, topbar com caminho (breadcrumbs), `PageHeader`, `StatCard` ink/branco/cyan/lime, `Panel`, `Badge`, `DataTable`, `ChipGroup`, `Segmented` e botões pílula.
- **Números:** saem da fonte pixelada (Pixelify Sans, substituta da GNF). Passam a usar **Onest semibold (600)**, `letter-spacing: -0.03em`, dígitos proporcionais (`proportional-nums lining-nums`) e KPI em 34px. Em tabelas e colunas de valores, use dígitos de largura fixa (`tabular-nums`). Isso muda o `DESIGN.md` (Typography) e `--font-pixel` / os estilos de valor em `design-system/` no mesmo commit.
- **Telas do protótipo:** Visão geral, Contatos e Negócios, nos temas claro e escuro. O protótipo é uma amostra de **estilo e organização**, não do conteúdo completo de cada tela.
- **Conteúdo da Visão geral:** mantém **todos os blocos de hoje**, só reorganizados e limpos no padrão do protótipo:
  - seletor de funil e filtro de período completo;
  - KPIs (incluindo "Pipeline total" e "Receita ganha");
  - alertas do funil e o modal deles;
  - saúde da carteira (valor médio por cliente e taxa de cancelamento);
  - métricas de mensagens e da IA;
  - feed de atividades.

  O que o protótipo trouxe de novo (ex.: "Precisam de retorno", "Exportar") só entra se usar dado ou função que já existe; nada de consulta nova nesta fase.

## Regras de limpeza (checklist por tela)

Aplicam-se a todo arquivo de tela tocado.

**Fundo e profundidade**
- Sem `bg-dots`, sem manchas desfocadas (`blur-[…]`, `blur-2xl/3xl`) e sem degradês decorativos atrás do conteúdo.
- Fundo da área de conteúdo = `--bg-app` do design system.
- Vidro (`backdrop-blur`) só onde o `DESIGN.md` prevê: sidebar e overlays (modais/gavetas).
- Degradê só onde o `DESIGN.md` prevê: StatCard ink/cyan/lime, item ativo da navegação, avatar e barras de gráfico.
- Cards: `Panel` / `--shadow-sm`. Sombras maiores (`shadow-lg/xl/2xl`) só em camadas flutuantes (menus, toasts, modais).

**Cor**
- Uma fileira de KPIs segue a regra do design system: um card ink (o que pede ação), brancos e no máximo um cyan ou lime.
- Ícones monocromáticos (`currentColor`, tons de texto). Nada de fundos coloridos diferentes por ícone.
- Cor de status só em selo (`Badge` tones), nunca em blocos grandes.
- Colunas do Board neutras (`Panel variant="tint"`). A identidade da etapa vai no título e na contagem, não na cor.
- Cores de canal (WhatsApp, Instagram etc.) continuam, mas só como marcador pequeno.

**Tipografia**
- Peso máximo 600 (`font-semibold`). `font-bold` sai.
- Tamanho mínimo 12px (micro). `text-[10px]` e `text-[11px]` sobem para 12px.
- CAIXA ALTA só em cabeçalho de tabela e rótulos de grupo (eyebrow), como no design system.

**Estrutura de página (a "planta")**
- Topbar com caminho (grupo / tela).
- Depois, `PageHeader`: título, uma frase de escopo e ações à direita (secundária + primária).
- Depois, filtros/abas e, por fim, o conteúdo. Igual em todas as telas.
- Estado vazio diz o que aconteceu e o próximo passo.

**Texto e formatos**
- Português do Brasil em toda a interface: "Negócios" (não "Boards"/"Deals"), "Visão geral", "Taxa de cancelamento" (não "Churn"), "Valor médio por cliente" (não "LTV"), "Tempo da 1ª resposta".
- Dinheiro em `R$ 1.234,56`, percentual `12,4%`, milhar com ponto. Datas no formato do `DESIGN.md` (DD.MM.AAAA).
- Sem emoji. Botões com verbo + objeto.
- Logo/marca: monograma AT do design system (`Brand`/`BrandMark`), nunca o "S" da SucçãoZero.
- Nome do CRM vem de `CRM_NAME` / `NEXT_PUBLIC_CRM_NAME`.

## Fases

Cada fase é um conjunto de commits que pode ir ao ar sozinho.

1. **Base (vale para todas as telas):**
   - shell autenticado (`components/Layout.tsx` e o que ele usa) passa a ter a sidebar do design system: vidro, acesso rápido, grupos, sino/sair e cartão do usuário. Topbar com caminho, alternância de tema e organização.
   - Mantém exatamente os itens, rotas, contadores (ex.: 99+ de mensagens), atalhos e comportamento atuais, incluindo o recolher e a gaveta no celular.
   - Sai `bg-dots` e os enfeites globais.
   - Troca dos números no design system.
2. **Visão geral** (`features/dashboard`): recompor no padrão do protótipo, com todos os blocos e dados de hoje (ver "Decisões tomadas pelo dono").
3. **Contatos** (`features/contacts`) e **Negócios** (`features/boards`, Board/Kanban): recompor como no protótipo, mantendo filtros, seleção em massa, busca, drag-and-drop e modais.
4. **Demais telas** (Inbox, Mensagens, Atividades, Relatórios, Configurações, Perfil, modais e gavetas): aplicar o checklist de limpeza e a planta de página, sem redesenho profundo.

Ordem sugerida: 1 → 2 → 3 → 4. Cada fase termina com `npm run precheck` verde e capturas nos dois temas.

## Restrições

- Next.js 16, Tailwind v4, componentes de `@/design-system` (nunca de caminhos internos; o ESLint barra). Regras do `CLAUDE.md` valem.
- Cor, fonte, espaçamento e raio vêm de token. As famílias Tailwind remapeadas em `app/globals.css` continuam valendo para o que não for migrado.
- Deploy: push em `alice-teixeira` monta o pacote no GitHub. Depois é preciso clicar em **Implantar** no serviço `crm-alice` do EasyPanel.
- Verificação visual: o CRM só mostra as telas internas logado. Use o CRM publicado ou um `.env.local` com as chaves públicas da Alice; nunca digite senha.

## Decisões de execução (tomadas por Claude; o dono pode revisar)

- **Sidebar:** mantém todos os itens e entradas atuais.
  - O perfil abre pelo cartão do usuário (`UserCard`).
  - O botão flutuante do assistente de IA continua como está hoje.
  - Contadores só aparecem onde já existe dado (ex.: 99+ de mensagens); nenhuma consulta nova para contadores. O "214" do protótipo era ilustrativo.
  - O `Sidebar` do design system pode ganhar uma extensão de API sem efeito visual (link com `href`/prefetch do Next, ou um item renderizado por fora), para navegar com `Link`. Isso não conta como mudança de visual do design system.
- **Caminho (breadcrumbs) por tela:**
  - Trabalho: Inbox, Mensagens, Atividades.
  - Comercial: Visão geral, Negócios, Relatórios.
  - Relacionamento: Contatos.
  - Conta: Configurações, Perfil.
  - Na sidebar, o "Acesso rápido" mostra Inbox, Visão geral, Negócios e Atividades; os grupos listam o resto.
- **Branch e publicação:** commits em `alice-design-system`. Ao fim de cada fase:
  - `npm run precheck` verde;
  - capturas nos dois temas, mostradas ao dono;
  - só com o OK dele, fast-forward de `alice-teixeira`, push e **Implantar** no EasyPanel.

## O que fica a critério de quem executa

- Quais componentes de tela antigos viram componentes do design system e quais só recebem as classes certas. Prefira o design system quando o equivalente existir sem perder função.
- A ordem dos commits dentro de cada fase.
- Textos de estado vazio e subtítulos de página, seguindo a voz do `DESIGN.md`.
