'use client';

import React from 'react';
import recordsFiles from '@/design-system/assets/icons-3d/records-files.png';
import {
  AppShell, AreaChart, Avatar, Badge, BarChart, Brand, BrandMark, Breadcrumbs, Button, Calendar, ChartTooltip, Chip,
  ChipGroup, DataTable, DonutChart, FileDrop, FileItem, Heatmap, Icon, Icon3D, IconButton, InfoTile, KeyValueList, Legend,
  ListRow, MetricCard, Modal, ModalSection, NavGroup, NavItem, OrgSelector, PageHeader, Panel, ProgressBar, QuickTile,
  RiskItem, ScheduleItem, SearchInput, Segmented, SegmentedProgress, ShiftCard, Sidebar, Sparkline, StatCard, Tag,
  TaskCard, TextField, TickGauge, Topbar, UserCard,
} from '@/design-system';
import type { Icon3DName } from '@/design-system';

type Theme = 'light' | 'dark';

const ICONS = ['activity', 'square-check', 'users', 'briefcase', 'message-circle', 'calendar', 'bell', 'search', 'settings', 'log-out', 'sun', 'moon', 'chevrons-left', 'chevron-right', 'phone', 'mail'];
const ICONS_3D: Icon3DName[] = ['records-files', 'employee-profile', 'permissions', 'library', 'training', 'settings'];
const HEAT = Array.from({ length: 20 }, (_, w) => Array.from({ length: 7 }, (_, d) => {
  const r = (Math.sin(w * 7.3 + d * 3.1) + 1) / 2;
  return (r > 0.985 ? 3 : r > 0.62 ? 2 : r > 0.4 ? 1 : 0) as 0 | 1 | 2 | 3;
}));

const grid = (cols: string, gap = 12): React.CSSProperties => ({ display: 'grid', gridTemplateColumns: cols, gap });
const row: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 };
const col: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14 };

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section style={{ ...col, gap: 12 }}>
      <div>
        <p className="at-eyebrow" style={{ margin: 0 }}>{title}</p>
        {note ? <p style={{ margin: '6px 0 0', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Library({ theme }: { theme: Theme }) {
  const [chip, setChip] = React.useState('Todos');
  const [seg, setSeg] = React.useState('PT');
  const [day, setDay] = React.useState(9);
  const [nav, setNav] = React.useState('negocios');
  const [modal, setModal] = React.useState(false);

  return (
    <div style={{ ...col, gap: 32 }}>
      <Section title="Marca" note="BrandMark segue currentColor.">
        <div style={row}><Brand /><Brand showName={false} size={40} /><BrandMark height={28} /></div>
      </Section>

      <Section title="Ícones" note="Glifos Lucide (lucide-react) e ilustrações 3D em vidro.">
        <div style={{ ...row, gap: 16 }}>{ICONS.map((n) => <Icon key={n} name={n} size={20} title={n} />)}</div>
        <div style={{ ...row, gap: 16 }}>{ICONS_3D.map((n) => <Icon3D key={n} name={n} size={64} alt={n} />)}</div>
      </Section>

      <Section title="Ações — Button e IconButton" note="Estados: default, hover e active (passe o mouse/clique), focus (use Tab), disabled.">
        <div style={row}>
          <Button>Criar negócio</Button><Button variant="secondary">Exportar</Button><Button variant="outline">Gerenciar</Button>
          <Button variant="accent">Nova cadência</Button><Button variant="accent-outline">Saiba mais</Button><Button variant="ghost" icon="plus">Adicionar</Button>
          <span style={{ padding: 6, borderRadius: 'var(--radius-pill)', background: 'var(--gradient-ink)' }}><Button variant="inverse" size="sm">Inverse</Button></span>
        </div>
        <div style={row}>
          <Button size="sm">Fechar</Button><Button icon="download">Exportar relatório</Button><Button size="lg">Salvar</Button>
          <Button disabled>Desabilitado</Button><Button variant="secondary" disabled>Desabilitado</Button>
          <Button variant="secondary" size="sm" iconRight="arrow-right">Ver todos</Button><Button block>Largura total</Button>
        </div>
        <div style={row}>
          <IconButton icon="chevrons-left" label="Recolher" /><IconButton icon="sun" label="Tema" round /><IconButton icon="x" label="Fechar" variant="ghost" round />
          <IconButton icon="chevron-right" label="Abrir" variant="tinted" size="sm" round /><IconButton icon="arrow-right" label="Ir" variant="dark" round size="sm" />
          <IconButton icon="bell" label="Notificações" size="lg" dot /><IconButton icon="trash-2" label="Excluir" disabled />
          <div style={{ display: 'flex', gap: 8, width: 220 }}><IconButton icon="bell" label="Avisos" variant="tile" dot /><IconButton icon="log-out" label="Sair" variant="tile" /></div>
        </div>
      </Section>

      <Section title="Formulários" note="Selecionado (Chip, Segmented), erro (TextField), vazio (FileDrop).">
        <div style={row}>
          <SearchInput placeholder="Buscar contatos" style={{ width: 240 }} />
          <SearchInput variant="filled" placeholder="Filled" style={{ width: 200 }} />
          <ChipGroup options={[{ value: 'Todos', label: 'Todos', count: 124 }, 'Novos', 'Em negociação', 'Ganhos']} value={chip} onChange={setChip} />
        </div>
        <div style={row}>
          <Segmented options={['PT', 'EN']} value={seg} onChange={setSeg} />
          <Segmented variant="text" size="sm" options={['Semana', 'Mês']} value="Semana" />
          <Chip active>Selecionado</Chip><Chip count={3}>Com contagem</Chip><Chip size="sm">Pequeno</Chip>
          <div style={{ width: 200, background: 'var(--surface-glass)', borderRadius: 'var(--radius-md)', padding: '0 8px' }}><SearchInput variant="bare" placeholder="Bare" /></div>
        </div>
        <div style={grid('1fr 1fr 1fr', 14)}>
          <TextField label="Nome do contato" defaultValue="Marina Duarte" />
          <TextField label="Retorno em" defaultValue="14.02.2026" icon="calendar" error="A data já passou" />
          <TextField label="Telefone" placeholder="(11) 90000-0000" />
        </div>
        <div style={grid('1fr 1fr', 14)}><FileDrop title="Solte o contrato aqui" hint="PDF até 10 MB" /><FileItem name="Contrato de honorários.pdf" meta="2,4 MB · 14.02.2026" /></div>
      </Section>

      <Section title="Exibição">
        <div style={row}>
          <Badge tone="info">Registrado</Badge><Badge tone="success">Ganho</Badge><Badge tone="warning">Vence logo</Badge><Badge tone="danger">Atrasado</Badge>
          <Badge tone="active">Em andamento</Badge><Badge tone="neutral">7 dias</Badge><Badge tone="lime">Novo</Badge><Badge tone="info" dot>Ativo</Badge><Badge tone="neutral" size="sm">sm</Badge>
        </div>
        <div style={row}><Tag>Trabalhista</Tag><Tag>Família</Tag><Tag variant="outline" sub="sem acesso">Cível</Tag><Tag round>C</Tag></div>
        <div style={{ ...row, gap: 24 }}>
          <Avatar initials="AT" /><Avatar initials="MD" size={56} /><Avatar initials="RS" size={32} radius={16} variant="light" />
          <div style={{ width: 180 }}><ProgressBar value={11} max={40} /></div>
          <div style={{ width: 180 }}><ProgressBar value={34} max={40} tone="lime" /></div>
          <div style={{ width: 180 }}><ProgressBar value={38} max={40} tone="danger" /></div>
          <div style={{ width: 180 }}><SegmentedProgress filled={[0, 0, 0, 1, 0, 1, 2]} /></div>
        </div>
      </Section>

      <Section title="Cards">
        <div style={grid('repeat(4, 1fr)')}>
          <StatCard variant="ink" label="Atrasados" value="3" unit="precisam de ação" />
          <StatCard label="Para hoje" value="7" />
          <StatCard variant="cyan" label="Novos na semana" value="+12" unit="leads" />
          <StatCard variant="lime" label="Ganhos na semana" value="4" />
        </div>
        <div style={grid('240px 1fr')}>
          <MetricCard icon="refresh-cw" badge="dentro da meta" value="84" unit="%" title="Taxa de resposta" subtitle="2 conversas sem retorno" segments={[0, 0, 0, 1, 0, 1, 2]} />
          <Panel title="Carteira" meta={<Badge tone="neutral">7 dias</Badge>} padding="sm">
            <div style={grid('repeat(3, 1fr)', 8)}><InfoTile label="Status" value="Ativo" /><InfoTile label="Último contato" value="há 2 dias" /><InfoTile label="Responsável" value="Marina" /></div>
            <KeyValueList density="compact" items={[{ label: 'Negócios abertos', value: '124' }, { label: 'Parados > 10 dias', value: '13' }, { label: 'Perdidos no mês', value: '2' }]} />
          </Panel>
        </div>
        <div style={grid('repeat(4, 1fr)')}>
          <Panel title="card" padding="sm">Superfície padrão.</Panel>
          <Panel title="tint" variant="tint" padding="sm">Agrupador sem sombra.</Panel>
          <Panel title="glass" variant="glass" padding="sm">Vidro fosco.</Panel>
          <Panel title="ink" variant="ink" padding="sm">Destaque escuro.</Panel>
        </div>
      </Section>

      <Section title="Listas" note="Tabela com linha clicável; vazio e risco nos itens.">
        <Panel padding="sm">
          <DataTable chevron density="compact" onRowClick={() => {}}
            columns={[{ key: 'd', label: 'Data' }, { key: 'c', label: 'Contato' }, { key: 'e', label: 'Etapa' }, { key: 'v', label: 'Valor', numeric: true },
              { key: 's', label: 'Status', render: (v: string) => <Badge tone={v === 'Atrasado' ? 'danger' : 'info'}>{v}</Badge> }]}
            rows={[{ d: '02.09.2026', c: 'Marina Duarte', e: 'Proposta', v: '18 000', s: 'Registrado' }, { d: '01.09.2026', c: 'Rafael Souza', e: 'Reunião', v: '7 500', s: 'Atrasado' }]} />
        </Panel>
        <DataTable columns={[{ key: 'a', label: 'Sem linhas' }]} rows={[]} />
        <div style={grid('1fr 1fr')}>
          <div style={{ ...col, gap: 8 }}>
            <ScheduleItem time="09:00" title="Ligar para Marina" subtitle="Retorno da proposta" tone="success" badge="Hoje" badgeTone="info" />
            <ScheduleItem time="11:30" title="Reunião com Rafael" subtitle="Google Meet" tone="info" badge="Em andamento" badgeTone="active" onClick={() => {}} />
            <div style={{ ...row, gap: 8 }}><TaskCard title="Enviar contrato" subtitle="Marina" /><TaskCard title="Revisar proposta" subtitle="Aprovação" tone="warning" /><TaskCard title="Cobrar retorno" subtitle="9 dias atrasado" tone="danger" /></div>
          </div>
          <Panel padding="sm">
            <RiskItem tone="danger" title="Sem resposta" unit="Rafael Souza" meta="Último contato 03.09.2026" badge="Atrasado" />
            <RiskItem tone="warning" title="Proposta parada" unit="Marina Duarte" meta="Vence 05.09.2026" badge="Vence logo" />
            <ListRow icon="message-circle" title="Conversas" subtitle="12 não lidas" chevron onClick={() => {}} />
            <ListRow icon="user" title="Sem ação" subtitle="Linha estática" trailing={<Badge tone="neutral">0</Badge>} />
          </Panel>
        </div>
      </Section>

      <Section title="Gráficos" note="Barra vazia, ponto de destaque e tooltip ativo.">
        <div style={grid('1.3fr 1fr')}>
          <Panel title="Atividades por dia" padding="sm" meta={<Legend items={[{ label: 'Total', shape: 'hatch' }, { label: 'Concluídas', color: 'var(--cyan-500)' }]} />}>
            <BarChart height={200} barWidth={40} gap={10} yTicks={['100%', '50%', '0%']} activeIndex={1}
              data={[{ label: '25', total: 84, value: 46 }, { label: '26', total: 62, value: 34, tooltip: { title: 'Quarta, 26.08', value: '62%', unit: 'carga', chip: 'Concluído 34%' } }, { label: '27', total: 50, value: 30, tone: 'lime' }, { label: '28', total: 55, value: 22 }, { label: '29', total: 92, value: 52 }, { label: '30', empty: true }]} />
          </Panel>
          <Panel title="Negócios por etapa" padding="sm" meta={<Badge tone="neutral">agora</Badge>}>
            <div style={{ ...row, justifyContent: 'space-around' }}>
              <DonutChart size={130} thickness={20} value="25" label="total" segments={[{ value: 14, color: 'var(--ink-800)' }, { value: 7, color: 'var(--cyan-500)' }, { value: 3, color: 'var(--lime-500)' }, { value: 1, color: 'var(--red-500)' }]} />
              <div style={{ ...col, gap: 6, alignItems: 'center' }}><TickGauge value={84} size={96} /><TickGauge variant="arc" color="cyan" value={72} display="720" unit="leads" size={110} /><TickGauge color="lime" value={40} size={80} /></div>
            </div>
          </Panel>
        </div>
        <div style={grid('1.3fr 1fr')}>
          <Panel title="Receita" padding="sm" meta={<Badge tone="neutral">7 dias</Badge>}>
            <AreaChart height={150} data={[17700, 18050, 18150, 18040, 17860, 18100, 18450, 18300]} min={17600} max={18600} yTicks={3} activeIndex={3}
              labels={['Seg', '', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']}
              renderTooltip={(v: number) => <ChartTooltip variant="line" title="Qua, 30.08" label="Receita" value={v.toLocaleString('pt-BR')} unit="R$" />} />
          </Panel>
          <Panel title="Mapa de contatos" padding="sm" meta={<Badge tone="neutral">20 semanas</Badge>}>
            <Heatmap weeks={HEAT} cellGap={3} days={null} months={[{ label: 'Out', col: 0 }, { label: 'Nov', col: 5 }, { label: 'Dez', col: 10 }, { label: 'Jan', col: 14 }]} />
            <div style={{ ...row, justifyContent: 'space-between' }}><span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>Respondidas · 38 de 60</span><Sparkline data={[2, 5, 7, 6, 5, 7, 7.4, 7.5]} width={110} height={36} /></div>
          </Panel>
        </div>
        <div style={row}>
          <ChartTooltip title="Terça, 08.09" value="5" unit="tarefas" chip="+1,7 vs média" />
          <ChartTooltip variant="line" arrow="left" title="Qua" label="Leads" value="42" />
        </div>
      </Section>

      <Section title="Agenda" note="Dia selecionado, marcadores e folga.">
        <div style={grid('1fr 1fr')}>
          <Panel title="Setembro 2026" padding="sm" meta={<Badge tone="neutral">9 atividades</Badge>}>
            <Calendar year={2026} month={8} selected={day} onSelect={setDay} cellHeight={34} gap={2} weekdays={['S', 'T', 'Q', 'Q', 'S', 'S', 'D']} markers={{ 3: true, 9: true, 15: true, 17: true, 22: 'var(--lime-500)', 25: true }} />
          </Panel>
          <div style={{ ...col, gap: 12 }}>
            <Panel title="Esta semana" padding="sm">
              <div style={grid('repeat(3, 1fr)', 8)}>
                <ShiftCard dayLabel="Seg" dayNumber={7} name="Plantão" time="09:00–18:00" zone="Atendimento" />
                <ShiftCard dayLabel="Qua" dayNumber={9} tone="lime" name="Audiência" time="14:00–16:00" zone="Fórum" />
                <ShiftCard dayLabel="Sáb" dayNumber={12} tone="off" name="Folga" />
              </div>
            </Panel>
            <Panel padding="sm"><Calendar year={2026} month={8} outside={false} cellHeight={22} gap={3} weekdays={['S', 'T', 'Q', 'Q', 'S', 'S', 'D']} cells={{ 1: 'cyan', 2: 'lime', 3: 'cyan', 4: 'cyan', 7: 'cyan', 8: 'lime', 9: 'cyan', 13: 'ring' }} /></Panel>
          </div>
        </div>
      </Section>

      <Section title="Navegação">
        <div style={{ display: 'flex', gap: 20, height: 600 }}>
          <Sidebar active={nav} onNavigate={setNav} notifications user={{ initials: 'AT', name: 'Alice Teixeira', role: 'Administradora' }}
            quick={[{ id: 'painel', label: 'Painel', icon: 'activity' }, { id: 'negocios', label: 'Negócios', icon: 'briefcase' }, { id: 'inbox', label: 'Inbox', icon: 'message-circle' }, { id: 'agenda', label: 'Agenda', icon: 'calendar' }]}
            groups={[{ label: 'Relacionamento', items: [{ id: 'contatos', label: 'Contatos', icon: 'users', count: 124 }, { id: 'mensagens', label: 'Mensagens', icon: 'mail' }] }, { label: 'Gestão', items: [{ id: 'relatorios', label: 'Relatórios', icon: 'chart-column' }, { id: 'config', label: 'Configurações', icon: 'settings' }] }]} />
          <Sidebar collapsed active={nav} onNavigate={setNav} user={{ initials: 'AT', name: 'Alice Teixeira', role: 'Admin' }}
            quick={[{ id: 'painel', label: 'Painel', icon: 'activity' }, { id: 'negocios', label: 'Negócios', icon: 'briefcase' }]}
            groups={[{ label: 'Relacionamento', items: [{ id: 'contatos', label: 'Contatos', icon: 'users' }] }]} />
          <div style={{ flex: 1, minWidth: 0, ...col, gap: 20, paddingTop: 8 }}>
            <Topbar crumbs={[{ label: 'Comercial' }, { label: 'Negócios' }]} onToggleSidebar={() => {}} lang={seg} onLang={setSeg} theme={theme} onToggleTheme={() => {}} org="Alice Teixeira Advocacia" />
            <PageHeader title="Negócios" subtitle="Funil por etapa: volume, ritmo e riscos." actions={<><Button variant="secondary">Exportar</Button><Button icon="plus">Novo negócio</Button></>} />
            <div style={row}><Breadcrumbs items={[{ label: 'Início' }, { label: 'Contatos' }, { label: 'Marina Duarte' }]} /><OrgSelector label="Alice Teixeira Advocacia" /></div>
            <div style={{ width: 272, ...col, gap: 8 }}>
              <div style={grid('1fr 1fr', 8)}><QuickTile icon="activity" label="Painel" /><QuickTile icon="briefcase" label="Negócios" active /></div>
              <NavGroup label="Grupo aberto"><NavItem icon="users" label="Contatos" count={124} active /><NavItem icon="mail" label="Mensagens" /></NavGroup>
              <NavGroup label="Grupo fechado" defaultOpen={false}><NavItem icon="settings" label="Configurações" /></NavGroup>
              <UserCard initials="AT" name="Alice Teixeira" role="Administradora" />
            </div>
          </div>
        </div>
        <div style={{ height: 520, overflow: 'hidden', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--border-hairline)' }}>
          <AppShell style={{ minHeight: 520 }} sidebar={<Sidebar collapsed active="painel" groups={[{ label: 'Menu', items: [{ id: 'painel', label: 'Painel', icon: 'activity' }] }]} />}>
            <PageHeader title="AppShell" subtitle="Sidebar fixa + conteúdo fluido; vira gaveta abaixo de 1024px." />
            <div style={grid('repeat(3, 1fr)')}><StatCard label="Leads" value="124" /><StatCard variant="cyan" label="Reuniões" value="9" /><StatCard variant="lime" label="Ganhos" value="4" /></div>
          </AppShell>
        </div>
      </Section>

      <Section title="Overlays" note="Versão inline e modal real (aberto/fechado).">
        <div><Button onClick={() => setModal(true)}>Abrir modal</Button></div>
        <Modal open={modal} onClose={() => setModal(false)} title="Novo negócio" subtitle="Comercial" footer={<><Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button><Button onClick={() => setModal(false)}>Salvar</Button></>}>
          <TextField label="Contato" defaultValue="Marina Duarte" />
        </Modal>
        <Modal inline title="Ficha do contato" subtitle="Dados do cliente" art={recordsFiles.src} onClose={() => {}} width={652}
          footer={<><Button variant="secondary">Cancelar</Button><Button>Salvar</Button></>}>
          <div style={grid('repeat(3, 1fr)', 10)}><InfoTile label="Status" value="Ativo" /><InfoTile label="Origem" value="Instagram" /><InfoTile label="Responsável" value="Marina" /></div>
          <ModalSection title="Documento"><div style={grid('1fr 1fr')}><TextField label="CPF" defaultValue="000.000.000-00" /><TextField label="Cliente desde" defaultValue="14.02.2026" /></div></ModalSection>
          <ModalSection title="Anexos"><FileDrop /><FileItem name="Procuração.pdf" meta="1,1 MB · 14.02.2026" /></ModalSection>
        </Modal>
        <Modal inline plain title="Modal plain" onClose={() => {}} width={420}>Sem cabeçalho ilustrado.</Modal>
      </Section>
    </div>
  );
}

function ThemePanel({ theme }: { theme: Theme }) {
  return (
    <div data-theme={theme} className={theme === 'dark' ? 'dark' : undefined}
      style={{ background: 'var(--bg-app)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-body)', padding: 'var(--space-16)', borderRadius: 'var(--radius-2xl)' }}>
      <h2 style={{ font: 'var(--type-section-title)', margin: '0 0 24px' }}>Tema {theme === 'light' ? 'claro' : 'escuro'}</h2>
      <Library theme={theme} />
    </div>
  );
}

export function Showcase() {
  return (
    <main data-theme="light" style={{ padding: 'var(--space-12)', display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', background: 'var(--bg-page)', minHeight: '100vh' }}>
      <header style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
        <h1 style={{ font: 'var(--type-page-title)', margin: 0 }}>Design system — Alice Teixeira</h1>
        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
          Biblioteca completa de design-system/ nos dois temas. Contrato visual: DESIGN.md.
        </p>
      </header>
      <ThemePanel theme="light" />
      <ThemePanel theme="dark" />
    </main>
  );
}
