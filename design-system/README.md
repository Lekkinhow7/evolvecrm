# design-system/

Biblioteca do design system da Alice Teixeira. O contrato visual e a fonte da verdade dos tokens é o [`DESIGN.md`](../DESIGN.md) na raiz; esta pasta é a implementação.

Veja tudo funcionando em **`/design-system`** (`npm run dev` → http://localhost:3000/design-system): todos os componentes, estados e os dois temas.

## Mapa

| Caminho | O que tem |
|---|---|
| `index.ts` | Entrada pública. Importe sempre de `@/design-system`. |
| `styles.css` | Entrada CSS completa (tokens + base + componentes). O app importa as partes em `app/globals.css`, sem `tokens/base.css`. |
| `tokens/colors.css` | Paleta, cores semânticas, status, data-viz e gradientes. Claro em `:root`/`[data-theme="light"]`, escuro em `.dark`/`[data-theme="dark"]`. |
| `tokens/typography.css` | Famílias (Onest; `--font-pixel` também aponta para a Onest), escala de tamanhos, pesos e papéis (`--type-*`). |
| `tokens/spacing.css` | Espaços (`--space-*`), raios (`--radius-*`), alturas de controle e medidas de layout. |
| `tokens/effects.css` | Sombras, blur e movimento. |
| `tokens/base.css` | Reset e utilitários `.at-eyebrow` / `.at-num`. Só carregado nas páginas de referência. |
| `components/<grupo>/` | `Componente.tsx` (código tipado), `<grupo>.css` (estilos `.at-*`) e `Componente.md` (guia de uso vindo do Claude Design). |
| `assets/` | Logos e monograma AT (`logo-alice-*.svg`, `monogram-*.svg`, `logo.svg` original), ícones 3D (`icons-3d/`) e imagens (`imagery/`). |
| `reference/` | HTMLs de referência visual do Claude Design. Abra direto do disco no navegador; ver abaixo. |

### Componentes (50)

| Grupo | Componentes |
|---|---|
| icons | Icon, Icon3D |
| actions | Button, IconButton |
| forms | SearchInput, TextField, Segmented, ChipGroup, Chip, FileDrop, FileItem |
| display | Badge, Tag, Avatar, ProgressBar, SegmentedProgress |
| cards | Panel, StatCard, MetricCard, InfoTile, KeyValueList |
| lists | DataTable, ScheduleItem, TaskCard, RiskItem, ListRow |
| charts | BarChart, AreaChart, DonutChart, TickGauge, Heatmap, Sparkline, ChartTooltip, Legend |
| calendar | Calendar, ShiftCard |
| overlays | Modal, ModalSection |
| navigation | AppShell, Sidebar, NavItem, NavGroup, QuickTile, UserCard, Topbar, Breadcrumbs, OrgSelector, PageHeader, Brand, BrandMark |

Diferenças em relação ao export do Claude Design:
- `Icon` usa `lucide-react/dynamic` em vez de baixar o SVG do CDN da unpkg.
- `Icon3D` não recebe mais `base`; as imagens são importadas e empacotadas pelo Next.

## HTMLs de referência

Abra direto do disco (duplo clique). Eles carregam React/Babel e as fontes da internet, e o runtime `reference/_ds_bundle.js` gerado pelo Claude Design.

- `reference/thumbnail.html` — capa.
- `reference/guidelines/*.html` — cartões de fundamentos: cores, tipografia, espaçamento e marca.
- `reference/components/*.card.html` — um cartão por grupo de componentes.
- `reference/ui_kits/admin/index.html` e `mobile.html` — dashboard admin clicável do caso de referência.

O `_ds_bundle.js` é uma cópia compilada da versão original dos componentes. Ele serve só para essas páginas e não é usado pelo app. Se um componente mudar em `components/`, as referências não acompanham.

## Criar um componente novo

1. Escolha o grupo em `components/` (ou crie um, com seu `<grupo>.css`).
2. Crie `Componente.tsx` com `'use client'`, a interface `ComponenteProps` exportada e as classes com prefixo `.at-componente`.
3. Escreva os estilos em `<grupo>.css` usando só tokens (`var(--…)`): nada de hex, `px` de espaçamento/raio solto ou fonte fora da Onest. O ESLint barra hex e fontes nos `.tsx` desta pasta.
4. Se criou um `<grupo>.css` novo, importe-o em `styles.css` e em `app/globals.css` (`layer(components)`).
5. Exporte em `index.ts`.
6. Adicione o componente, com todos os estados, ao showcase em `app/design-system/Showcase.tsx`.
7. Se surgir um token novo, registre-o no `DESIGN.md` e em `tokens/`, no mesmo commit.
