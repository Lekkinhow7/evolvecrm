---
version: alpha
name: Alice Teixeira
description: Contrato visual do CRM da Alice Teixeira — "Clarity · Glass · Data". Fonte da verdade dos tokens; a implementação vive em design-system/tokens/*.css.
colors:
  # Identidade
  ink: "#062E35"
  cyan: "#1B9FC0"
  mist: "#EAF1F4"
  lime: "#A6CB2E"
  # Escalas
  ink-950: "#03161B"
  ink-900: "#041E24"
  ink-800: "#062E35"
  ink-700: "#0B3B44"
  ink-600: "#134B55"
  ink-500: "#2D5F69"
  slate-700: "#2F4E56"
  slate-600: "#3F5F67"
  slate-500: "#5E7C84"
  slate-400: "#7A9EA8"
  slate-300: "#A9C0C6"
  slate-200: "#D3E1E5"
  slate-150: "#E3ECEF"
  slate-100: "#EAF1F4"
  slate-50: "#F3F7F8"
  slate-25: "#F7FAFB"
  cyan-800: "#0E6278"
  cyan-700: "#127A95"
  cyan-600: "#1B8FAE"
  cyan-500: "#1B9FC0"
  cyan-400: "#43B7D4"
  cyan-300: "#7FD3E5"
  cyan-200: "#B3E7F0"
  cyan-100: "#D4F1F6"
  cyan-50: "#EAF8FB"
  lime-700: "#5F7A0E"
  lime-600: "#86A81F"
  lime-500: "#A6CB2E"
  lime-400: "#BCDB4A"
  lime-300: "#D4EC6E"
  lime-100: "#EEF6CF"
  red-700: "#B23A28"
  red-600: "#C9432F"
  red-500: "#E5533D"
  red-300: "#F2A194"
  red-100: "#FBE4DF"
  amber-700: "#9A6410"
  amber-600: "#B07415"
  amber-500: "#F0A43A"
  amber-300: "#F6CE8B"
  amber-100: "#FBEFD6"
  white: "#FFFFFF"
  # Semânticos — tema claro
  background: "#F4F8F9"
  surface: "#FFFFFF"
  surface-sunken: "#F3F7F8"
  surface-muted: "#EAF1F4"
  surface-hover: "#EEF4F6"
  on-surface: "#062E35"
  on-surface-secondary: "#5E7C84"
  on-surface-tertiary: "#8AA3AA"
  border-hairline: "#E3ECEF"
  border-default: "#D8E4E8"
  primary: "#062E35"
  on-primary: "#FFFFFF"
  accent: "#1B9FC0"
  link: "#1B8FAE"
  info: "#1B9FC0"
  success: "#A6CB2E"
  warning: "#F0A43A"
  danger: "#E5533D"
  # Semânticos — tema escuro
  background-dark: "#06171C"
  surface-dark: "#0D252C"
  surface-sunken-dark: "#0A1F25"
  surface-muted-dark: "#112D35"
  surface-hover-dark: "#14343D"
  on-surface-dark: "#E8F2F4"
  on-surface-secondary-dark: "#93ADB4"
  primary-dark: "#1B8FAE"
typography:
  display:
    fontFamily: Onest
    fontSize: 80px
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: -0.035em
  page-title:
    fontFamily: Onest
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.02em
  section-title:
    fontFamily: Onest
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.15
  card-title:
    fontFamily: Onest
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.3
  body:
    fontFamily: Onest
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Onest
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Onest
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.3
  eyebrow:
    fontFamily: Onest
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.14em
  kpi:
    fontFamily: Onest
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: -0.03em
  kpi-card:
    fontFamily: Onest
    fontSize: 34px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: -0.03em
rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  pill: 999px
spacing:
  "1": 2px
  "2": 4px
  "3": 6px
  "4": 8px
  "5": 10px
  "6": 12px
  "7": 14px
  "8": 16px
  "10": 20px
  "12": 24px
  "14": 28px
  "16": 32px
  "20": 40px
  "24": 48px
  "32": 64px
  "40": 80px
  gutter: 24px
  card-gap: 16px
  card-pad: 24px
  control-sm: 32px
  control-md: 40px
  control-lg: 44px
  control-xl: 52px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    height: 44px
    padding: 0 22px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.pill}"
    height: 44px
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    height: 44px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: 24px
  card-title:
    typography: "{typography.card-title}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    height: 44px
  chip:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.pill}"
    height: 32px
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  badge-info:
    backgroundColor: "{colors.cyan-100}"
    textColor: "{colors.cyan-700}"
    rounded: "{rounded.pill}"
  badge-success:
    backgroundColor: "{colors.lime-100}"
    textColor: "{colors.lime-700}"
    rounded: "{rounded.pill}"
  badge-warning:
    backgroundColor: "{colors.amber-100}"
    textColor: "{colors.amber-700}"
    rounded: "{rounded.pill}"
  badge-danger:
    backgroundColor: "{colors.red-100}"
    textColor: "{colors.red-600}"
    rounded: "{rounded.pill}"
  modal:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.2xl}"
  kpi-value:
    typography: "{typography.kpi}"
---

# Alice Teixeira — DESIGN.md

Contrato visual do CRM. Os valores do front matter são a fonte da verdade; `design-system/tokens/*.css` é a implementação e tem que bater com eles. Ao mudar um token, mude os dois no mesmo commit.

## Overview

Linguagem "Clarity · Glass · Data": interfaces operacionais, limpas e densas em dados, que funcionam inteiras no desktop, tablet e celular sem cortar funções do desktop. Tom calmo e preciso: a interface diz o fato e a próxima ação; não comemora nem alarma.

- Textos em sentence case ("Criar negócio", "Vence logo"). MAIÚSCULAS só em eyebrows e rótulos de grupo da sidebar, via CSS com tracking largo.
- Sem emoji. Status é cor + palavra.
- Datas DD.MM.AAAA, horas 24h (09:00, 07:00–15:30), milhar com espaço (318 000), separador " · " entre fatos e "/" em breadcrumbs.
- Origem: o visual veio de um estudo de caso de referência (Klaris) recriado no Claude Design e rebatizado para Alice Teixeira (monograma AT).

## Colors

Quatro cores de identidade: **Ink** `#062E35` (texto, botão primário, cards escuros), **Cyan** `#1B9FC0` (dados, navegação ativa, destaques), **Mist** `#EAF1F4` (superfícies claras) e **Lime** `#A6CB2E` (conclusão, positivo). Todo neutro é puxado para azul-esverdeado (escala slate); não existe cinza puro.

- Status: tint suave + texto forte. Info = cyan, sucesso = lime, atenção = amber `#F0A43A`, perigo = red `#E5533D`, em andamento = ink.
- Uma fileira de KPIs costuma ter um card ink (o que precisa de ação), cards brancos e um card cyan ou lime.
- Gradientes só como preenchimento de material: KPIs, item ativo da navegação, avatar, barras de gráfico. Nunca atrás de texto no app; nunca roxo.
- Tema escuro é de primeira classe (`.dark` ou `[data-theme="dark"]`): página `#06171C`, cards `#0D252C`, linhas a 7% de branco, texto `#E8F2F4`. A ação primária e os chips ativos trocam de ink para cyan.
- No CRM, as famílias Tailwind `slate`, `gray`, `zinc`, `neutral`, `sky`, `cyan` e `primary` estão remapeadas para essas escalas em `app/globals.css`. Isso re-pinta as telas antigas, mas código novo usa tokens.

## Typography

**Onest** em tudo (300/400/500/600). Display em Regular com tracking apertado (−0.035em), 56–112px, em dois tons. Título de página 40px Semibold, título de card 18px Medium, corpo 15px, legenda 13px.

Números de KPI, gauges e totais de donut usam **Onest semibold (600)** com `letter-spacing: -0.03em` e dígitos proporcionais (`proportional-nums lining-nums`). O valor do `StatCard` tem 34px (`--fs-kpi-card`). Em tabelas e colunas de valores use dígitos de largura fixa (`tabular-nums`, classe `.at-num`). A fonte pixel (GNF / Pixelify Sans) foi abandonada em 17/10/2026: o token `--font-pixel` continua existindo por compatibilidade e aponta para a Onest.

No app a fonte vem de `next/font` (`app/layout.tsx`) pela variável `--font-onest`.

## Layout

Sidebar de vidro fixa (272px, recolhe para um trilho de 84px) + conteúdo fluido. Topbar com breadcrumbs à esquerda e idioma, tema e organização à direita. Cabeçalho de página com ações embaixo à direita. Fileira de 4 KPIs, linhas de 2 colunas (≈1,55 : 1). Gap 16, gutter 24, padding de card 24.

Abaixo de 1024px a sidebar vira gaveta. Abaixo de 640px tudo empilha, as ações da página dividem 50/50, as tabelas viram cards rótulo/valor e os modais viram bottom sheets.

## Elevation & Depth

Elevação sutil; a profundidade vem do contraste branco sobre mist. Cards usam `--shadow-sm` (sombra azul-esverdeada bem leve). Tooltips e modais ganham sombras mais fortes (`--shadow-tooltip`, `--shadow-modal`). A sidebar é vidro fosco (`--surface-glass` + blur de 24px + brilho interno no topo). Overlays escurecem com scrim azul-petróleo + blur de 8px.

Movimento discreto e funcional: 140–360ms, `cubic-bezier(0.22,1,0.36,1)`, fades e subida de 12px para modais. Sem bounce, sem parallax.

## Shapes

Cantos generosos: 4 (células de heatmap) · 8 · 12 (itens de navegação, icon buttons) · 16 (tiles, inputs, linhas de lista) · 24 (cards, KPIs, sidebar) · 32 (modais) · pill (botões, chips, badges, busca, tags).

Bordas: linhas de 1px `#E3ECEF` para separadores e linhas de tabela; tracejado para estados vazios e de destino (drop de arquivo, barra vazia). Sem cards com borda colorida à esquerda; as únicas barras coloridas são as de 3px dentro de ScheduleItem/TaskCard.

As classes Tailwind `rounded-*` e `shadow-*` usam esses valores: os tokens do design system sobrescrevem a escala padrão do Tailwind.

## Components

A biblioteca está em `design-system/` e sai sempre de `@/design-system` (o ESLint bloqueia imports internos). São 50 componentes React tipados, em 10 grupos: ícones, ações, formulários, exibição, cards, listas, gráficos, agenda, overlays e navegação. O mapa completo está em `design-system/README.md`, e todos aparecem com seus estados nos dois temas na rota `/design-system`.

Estados: hover = um passo mais claro/escuro (`--surface-hover`); press = `scale(0.98)` (icon buttons 0.95); focus = anel cyan de 3px (`--focus-ring`); ativo/selecionado = preenchimento ink (chips, segmented, tiles, dia do calendário) ou gradiente cyan (item de navegação); disabled = 45% de opacidade.

Os primitivos antigos de `components/ui/` continuam valendo para as telas existentes. O `Button` deles já usa as classes `.at-btn--*`; os demais herdam os tokens pelo mapeamento de `app/globals.css`.

## Do's and Don'ts

- **Faça:** componentes novos com a biblioteca de `@/design-system`; cores, fontes, espaçamentos e raios pelos tokens (`var(--…)` ou as classes Tailwind remapeadas).
- **Faça:** confira cada tela nos dois temas.
- **Faça:** se faltar um componente, crie dentro de `design-system/components/<grupo>/` seguindo `design-system/README.md`.
- **Não faça:** cor hex, `px` solto de espaçamento/raio ou fonte fora da Onest no código novo.
- **Não faça:** emoji, roxo, gradiente atrás de texto ou borda colorida à esquerda em card.
- **Não faça:** use os ícones 3D e as imagens de `design-system/assets/` em produção. São recortes da referência e precisam ser trocados por originais.
