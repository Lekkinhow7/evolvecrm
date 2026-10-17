# Interface limpa da Alice — Fase 1 (base) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar a "moldura" de todas as telas autenticadas (menu lateral, topo, fundo e números) pelo design system da Alice, limpo, sem mudar nenhuma função.

**Architecture:**
- Uma configuração única de navegação (`shellNav.ts`) alimenta a sidebar e o caminho do topo.
- O `Layout.tsx` passa a montar `Sidebar` e `Topbar` de `@/design-system`, com uma extensão pequena de API para links do Next e um rodapé customizável.
- Os números do design system trocam a fonte pixelada pela Onest, no contrato (`DESIGN.md`) e nos tokens.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Vitest + Testing Library (happy-dom).

**Spec:** `docs/superpowers/specs/2026-10-17-alice-interface-limpa-design.md` (seções "Decisões tomadas pelo dono", "Regras de limpeza", "Fases" item 1 e "Decisões de execução").

## Global Constraints

- Não muda função, rota, permissão nem dado. O tablet (`NavigationRail`) e o celular (`BottomNav`/`MoreMenuSheet`) seguem como estão nesta fase; só os rótulos compartilhados mudam.
- Importar sempre de `@/design-system`, nunca de `@/design-system/components/...` (ESLint).
- Sem hex, fonte avulsa nem `px` solto nos arquivos de `design-system/`. Fora dele, usar tokens `var(--…)` ou as classes Tailwind remapeadas.
- Peso máximo 600; texto mínimo 12px; sem `bg-dots`, sem manchas `blur-[…]`; vidro só na sidebar e nos overlays.
- Textos em português: "Visão geral", "Negócios", "Contatos", "Mensagens", "Atividades", "Relatórios", "Configurações", "Perfil", "Inbox".
- Números: Onest 600, `letter-spacing: -0.03em`, `font-variant-numeric: proportional-nums lining-nums`; valor de `StatCard` em 34px.
- `DESIGN.md` e `design-system/tokens/*.css` mudam juntos, no mesmo commit.
- Commits em `alice-design-system`. Nada vai para `alice-teixeira` sem o OK do dono depois das capturas.
- Fim da fase: `npm run precheck` verde.

## Review Focus

1. **Rota ativa com alias:** `/pipeline` e `/boards/<id>` devem marcar "Negócios" como ativo; `/settings/ai` deve marcar "Configurações". O teste vai na Task 2.
2. **Contador de mensagens:** 0 não mostra nada; 1–99 mostra o número; acima de 99 mostra "99+". O teste vai na Task 2.
3. **Sidebar recolhida (`sidebarCollapsed`):** continua funcionando e atualiza `--app-sidebar-width` para a nova largura, para os modais não cobrirem o menu. O teste vai na Task 4.
4. **Usuário sem nome no perfil:** o cartão do usuário cai para apelido → primeiro nome → parte do e-mail → "Usuário", com iniciais coerentes. O teste vai na Task 4.
5. **Tela de Mensagens (`/messaging`)** continua sem padding no `main`, ocupando a altura toda. O teste vai na Task 4.

---

### Task 1: Números na Onest (design system)

**Files:**
- Modify: `DESIGN.md`: seção Typography; `typography.kpi.fontFamily` no front matter passa a `Onest`, com `fontWeight: 600`.
- Modify: `design-system/tokens/typography.css`: `--font-pixel` passa a apontar para Onest (mantém o nome do token para não quebrar componentes).
- Modify: `design-system/components/cards/cards.css` (`.at-stat__value`, `.at-metric__value`); `design-system/components/charts/charts.css` (`.at-donut__value`, `.at-gauge__value`); `design-system/tokens/base.css` (`.at-num`).
- Modify: `app/globals.css` (`--font-pixel` no `@theme`) e `tailwind.config.js` (`fontFamily.pixel`).
- Test: `design-system/tokens/typography.test.ts`

**Interfaces:**
- Produces: `--font-pixel` resolve para Onest. As classes de valor numérico usam peso 600, `letter-spacing:-0.03em` e `proportional-nums lining-nums`.

- [ ] **Step 1: Write the failing test.** `design-system/tokens/typography.test.ts` lê os arquivos com `fs`. Testes:
  - `--font-pixel usa Onest`: a declaração `--font-pixel:` em `typography.css` começa com `var(--font-onest` e não contém `Pixelify` nem `GNF`.
  - `valores numéricos usam peso 600 e dígitos proporcionais`: as regras `.at-stat__value`, `.at-metric__value`, `.at-donut__value` e `.at-gauge__value` contêm `font-weight:600` e `proportional-nums`.
  - `DESIGN.md kpi em Onest`: o bloco `kpi:` do front matter contém `fontFamily: Onest` e `fontWeight: 600`.
- [ ] **Step 2:** `npx vitest run design-system/tokens/typography.test.ts`. Esperado: FAIL nos três testes.
- [ ] **Step 3:** Aplicar os valores das Global Constraints nos arquivos listados.
  - Em `typography.css`: `--font-pixel:var(--font-onest,'Onest'),'Onest',ui-sans-serif,system-ui,sans-serif`.
  - `--type-kpi` passa a `var(--weight-semibold) var(--fs-kpi)/1 var(--font-pixel)`.
  - `.at-stat__value` usa `font-size:34px`. Como `px` solto é barrado, crie o token `--fs-kpi-card:34px` em `typography.css` e registre-o em `DESIGN.md`.
  - Na prosa do `DESIGN.md` (Typography): os números usam Onest semibold; a fonte pixel sai. Remova também a ressalva do GNF em `design-system/README.md`.
  - Em `app/layout.tsx`: remova o `Pixelify_Sans` e a variável `--font-pixelify`.
- [ ] **Step 4:** Rode `npx vitest run design-system/tokens/typography.test.ts`, depois `npm run lint` e `npm run typecheck`. Esperado: PASS.
- [ ] **Step 5: Commit.** `feat: números do design system na Onest`.

### Task 2: Configuração única de navegação

**Files:**
- Create: `components/navigation/shellNav.ts`
- Modify: `components/navigation/navConfig.ts` (rótulos: "Boards" → "Negócios", "Visão Geral" → "Visão geral")
- Test: `components/navigation/shellNav.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type ShellNavId = 'inbox' | 'messaging' | 'dashboard' | 'boards' | 'contacts' | 'activities' | 'reports' | 'settings' | 'profile';
  export type CrumbGroup = 'Trabalho' | 'Comercial' | 'Relacionamento' | 'Conta';
  export interface ShellNavItem { id: ShellNavId; label: string; href: string; icon: string /* lucide kebab-case */; prefetch?: RouteName; group: CrumbGroup }
  export const SHELL_NAV: Record<ShellNavId, ShellNavItem>;
  export const SIDEBAR_QUICK: ShellNavId[];                     // ['inbox','dashboard','boards','activities']
  export const SIDEBAR_GROUPS: { label: string; items: ShellNavId[] }[]; // [{label:'Relacionamento',items:['contacts','messaging']},{label:'Gestão',items:['reports','settings']}]
  export function getActiveNavId(pathname: string): ShellNavId | undefined;
  export function getBreadcrumbs(pathname: string): { label: string }[];   // [{label: group}, {label: item.label}]
  export function formatBadge(count: number | undefined): string | undefined; // 0/undefined → undefined; >99 → '99+'
  ```
  - Grupos do caminho (spec): Trabalho = inbox, messaging, activities; Comercial = dashboard, boards, reports; Relacionamento = contacts; Conta = settings, profile.
  - Ícones: inbox `inbox`, messaging `message-circle`, dashboard `activity`, boards `briefcase`, contacts `users`, activities `calendar-check`, reports `chart-column`, settings `settings`, profile `user`.
  - Prefetch: igual ao `Layout.tsx` atual.

- [ ] **Step 1: Write the failing test** `shellNav.test.ts`:
  - `getActiveNavId('/pipeline') === 'boards'`, `getActiveNavId('/boards/abc') === 'boards'`, `getActiveNavId('/settings/ai') === 'settings'`, `getActiveNavId('/dashboard') === 'dashboard'`, `getActiveNavId('/login') === undefined`.
  - `getBreadcrumbs('/contacts')` → `[{label:'Relacionamento'},{label:'Contatos'}]`; `getBreadcrumbs('/pipeline')` → `[{label:'Comercial'},{label:'Negócios'}]`; `getBreadcrumbs('/desconhecida')` → `[]`.
  - `formatBadge(0) === undefined`, `formatBadge(undefined) === undefined`, `formatBadge(7) === '7'`, `formatBadge(100) === '99+'`.
  - Todo id de `SIDEBAR_QUICK` e de `SIDEBAR_GROUPS` existe em `SHELL_NAV`, e juntos cobrem os 8 itens do menu atual (todos menos `profile`).
- [ ] **Step 2:** `npx vitest run components/navigation/shellNav.test.ts`. Esperado: FAIL (módulo não existe).
- [ ] **Step 3:** Implementar `shellNav.ts`.
  - O casamento é por prefixo (`pathname === href || pathname.startsWith(href + '/')`), com o alias `/pipeline` → `boards`.
  - Ajustar os rótulos em `navConfig.ts`.
- [ ] **Step 4:** Rodar o teste e `npm run typecheck`. Esperado: PASS.
- [ ] **Step 5: Commit.** `feat: configuração única do menu e do caminho`.

### Task 3: Extensão da API do Sidebar (links e rodapé)

**Files:**
- Modify: `design-system/components/navigation/Sidebar.tsx`
- Modify: `app/design-system/Showcase.tsx` (um exemplo com `linkAs`/`href`)
- Test: `design-system/components/navigation/Sidebar.test.tsx`

**Interfaces:**
- Produces (todas opcionais; o visual não muda):
  - `SidebarLink.href?: string`; `SidebarLink.count?: number | string`; `quick[].href?: string`.
  - `SidebarProps.linkAs?: React.ElementType`. Quando há `href`, `NavItem` e `QuickTile` renderizam `<LinkAs href className …>` em vez de `<button>`, com o mesmo `className` e `aria-current`.
  - `SidebarProps.onPrefetch?: (id: string) => void`, chamado em `onMouseEnter`/`onFocus`.
  - `SidebarProps.footer?: React.ReactNode` substitui os tiles padrão de sino e sair.
  - `SidebarProps.searchPlaceholder?: string`.

- [ ] **Step 1: Write the failing test** `Sidebar.test.tsx` (Testing Library):
  - Com `linkAs={(p) => <a {...p} />}` e um item `{id:'contacts', label:'Contatos', href:'/contacts'}`, existe `link` com nome "Contatos" e `href="/contacts"`, com `aria-current="page"` quando `active="contacts"`.
  - Sem `href`, continua sendo `button` e `onNavigate('contacts')` é chamado ao clicar.
  - `count="99+"` aparece no item.
  - Passando `footer={<span>rodape</span>}`, o texto "rodape" aparece e os botões "Notifications"/"Log out" não aparecem.
  - `onPrefetch` é chamado com o id no `mouseEnter`.
- [ ] **Step 2:** `npx vitest run design-system/components/navigation/Sidebar.test.tsx`. Esperado: FAIL.
- [ ] **Step 3:** Implementar as props em `Sidebar.tsx` (inclui `NavItem`, `QuickTile` e as interfaces). Defaults iguais aos atuais, para o showcase não mudar.
- [ ] **Step 4:** Rode o teste, depois `npx eslint --max-warnings 0 design-system app/design-system` e `npm run typecheck`. Esperado: PASS.
- [ ] **Step 5: Commit.** `feat: Sidebar do design system aceita links e rodapé`.

### Task 4: Moldura nova no Layout

**Files:**
- Create: `components/navigation/AppSidebar.tsx`
- Create: `components/navigation/AppTopbar.tsx`
- Modify: `components/Layout.tsx` (só o bloco desktop `<aside>`, o `<header>`, o fundo e o brilho ambiente; tablet, celular e painel da IA ficam)
- Test: `components/navigation/AppSidebar.test.tsx`, `components/Layout.test.tsx`

**Interfaces:**
- Consumes: `SHELL_NAV`, `SIDEBAR_QUICK`, `SIDEBAR_GROUPS`, `getActiveNavId`, `getBreadcrumbs` e `formatBadge` (Task 2); `Sidebar` com `linkAs`/`href`/`footer`/`onPrefetch` (Task 3).
- Produces:
  - `AppSidebar({ collapsed: boolean, unreadCount: number, profile, onSignOut: () => void })`:
    - `linkAs={Link}` do Next; `brand={<Brand name={CRM_NAME} />}`; `search={false}`; `quickLabel="Acesso rápido"`; `active` vem de `getActiveNavId(usePathname())`.
    - Mensagens recebem `count={formatBadge(unreadCount)}`.
    - `user` = `{ initials, name, role: e-mail, onClick: router.push('/profile') }`.
    - `footer` = um `IconButton` "Sair" (`log-out`, `variant="tile"`) que chama `onSignOut`.
  - `AppTopbar()`:
    - `Topbar` com `crumbs={getBreadcrumbs(pathname)}`, `langs={[]}`, `theme` e `onToggleTheme` do `ThemeContext`, e `onToggleSidebar`/`sidebarCollapsed` do `useUIState` (só no desktop).
    - `org={CRM_NAME}`.
    - `right` = botão do assistente de IA (Sparkles, alterna `isGlobalAIOpen`), botão de debug (só em `development`) e `<NotificationPopover />`, como no header atual.

- [ ] **Step 1: Write the failing tests:**
  - `AppSidebar.test.tsx` (mock de `next/navigation` com `usePathname` → `/pipeline`):
    - o link "Negócios" tem `aria-current="page"`;
    - com `unreadCount={150}` aparece "99+";
    - perfil `{ email:'ana@x.com' }` sem nome mostra "ana" e iniciais "AN";
    - clicar em "Sair" chama `onSignOut`.
  - `Layout.test.tsx` (mocks de auth com usuário, `useResponsiveMode` → desktop, `useUnreadCount` → 0, `UIChat` e `NotificationPopover` como stubs):
    - não existe elemento com classe `bg-dots` nem com `blur-[100px]`;
    - o `main#main-content` em `/messaging` tem `p-0`;
    - com `sidebarCollapsed=true`, `--app-sidebar-width` vale `calc(var(--sidebar-collapsed) + 32px)`;
    - com `false`, vale `calc(var(--sidebar-width) + 32px)`.
- [ ] **Step 2:** `npx vitest run components/navigation/AppSidebar.test.tsx components/Layout.test.tsx`. Esperado: FAIL.
- [ ] **Step 3:** Implementar `AppSidebar` e `AppTopbar` e trocar no `Layout.tsx`.
  - O `<aside>` desktop vira um wrapper `p-4` com `<AppSidebar collapsed={sidebarCollapsed} …/>`.
  - O `<header>` vira `<AppTopbar />`, dentro de um wrapper com padding horizontal igual ao do `main`.
  - O container raiz troca `bg-surface-bg bg-dots` por `style={{ background: 'var(--bg-app)' }}`.
  - Remover o bloco "Ambient background glow".
  - `--app-sidebar-width` desktop passa aos valores do teste.
  - Remover os imports que ficarem sem uso.
- [ ] **Step 4:** Rodar os testes e `npm run precheck`. Esperado: tudo PASS.
- [ ] **Step 5: Commit.** `feat: menu lateral e topo do design system no CRM`.

### Task 5: Conferência visual e entrega

**Files:** nenhum código. Opcional: criar `.env.local` (já ignorado pelo git) com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_CRM_NAME`, copiados do caso `alice-teixeira` de `.github/workflows/vps.yml`, que são valores públicos.

- [ ] **Step 1:** `npm run dev`. Abra `http://localhost:3000/login` na aba do Chrome do grupo do Claude e peça ao dono para entrar com a conta dele (nunca digitar a senha).
- [ ] **Step 2:** Captura nos dois temas de Visão geral, Negócios, Contatos, Inbox e Mensagens, desktop 1440px. Checar:
  - sidebar de vidro com logo AT, acesso rápido e grupos;
  - item ativo certo;
  - "99+" nas mensagens;
  - caminho no topo;
  - sino, IA e tema funcionando;
  - recolher o menu;
  - nenhuma mancha nem pontos no fundo.
- [ ] **Step 3:** Mostrar as capturas ao dono. Só com o OK dele:
  - fast-forward de `alice-teixeira`;
  - push e esperar o workflow "Versão para a VPS" verde;
  - **Implantar** no serviço `crm-alice` do EasyPanel;
  - conferir em `https://crm.aliceteixeiraadvogada.com.br`.
