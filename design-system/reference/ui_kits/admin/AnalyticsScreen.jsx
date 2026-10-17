(() => {
const { PageHeader, Button, Panel, MetricCard, DataTable, Badge, SearchInput, ChipGroup, Icon, IconButton } = window.AliceTeixeiraDesignSystem_69f9f3;

function HeroCard() {
  const cells = [['layers', 'Batches in progress', '12'], ['shield-check', 'Zone grade', 'A'], ['clock', 'Without deviations', '24 days'], ['calendar', 'Inspection', '18.09']];
  return (
    <div className="kit-hero">
      <div className="kit-hero__art" />
      <div className="kit-hero__top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.72)' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan-400)' }} />Cleanliness index · updated 12 minutes ago
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="at-num" style={{ fontSize: 68, lineHeight: 1 }}>87</span>
          <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>/100</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.01em' }}>Production in a<br />stable zone</div>
        <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 12px', borderRadius: 999, background: 'rgba(27,159,192,0.22)', color: '#8FDDEC', fontSize: 14 }}><Icon name="arrow-up" size={14} />3 this week</span>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 'auto' }}>All 6 control loops are running steadily.</div>
      </div>
      <div className="kit-hero__grid">
        {cells.map((c) => <div className="kit-hero__cell" key={c[1]}><span className="kit-hero__well"><Icon name={c[0]} size={16} /></span>{c[1]}<b>{c[2]}</b></div>)}
      </div>
    </div>
  );
}

function AnalyticsScreen() {
  const D = window.ATData;
  const [q, setQ] = React.useState('');
  const [f, setF] = React.useState('all');
  const rows = D.events.filter((e) => (f === 'all' || e.kind === f) && (!q || (e.event + e.section).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="kit-page">
      <PageHeader title="Analytics" subtitle="Cleanroom status overview for the Dubna plant." actions={<><Button variant="secondary">Export report</Button><Button>New round</Button></>} />
      <div className="kit-row" style={{ gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,1fr)' }}>
        <HeroCard />
        <div className="kit-metrics">
          <MetricCard icon="refresh-cw" badge="within limits" value="98" unit="%" title="Validation on schedule" subtitle="Cycle no. 4412 overdue" segments={[1, 1, 1, 1, 1, 1, 2]} />
          <MetricCard icon="gauge" badge="2 deviations" badgeTone="warning" value="76" unit="%" title="Environmental monitoring" subtitle="Airlock P-2 · pressure below limit" segments={[1, 1, 1, 1, 1, 0, 0]} />
          <MetricCard icon="clock" badge="within limits" value="4,1" unit="d" title="Sample turnaround" subtitle="Limit — 5 days" segments={[1, 1, 1, 1, 2, 0, 0]} />
          <MetricCard icon="lock" badge="within limits" value="100" unit="%" title="Cleanroom access" subtitle="Airlock P-1 · 214 entries" segments={[1, 1, 1, 1, 1, 1, 2]} />
        </div>
      </div>
      <Panel>
        <div className="kit-toolbar">
          <SearchInput placeholder="Search the table" value={q} onChange={setQ} />
          <ChipGroup value={f} onChange={setF} options={[{ value: 'all', label: 'All events' }, { value: 'drop', label: 'Index drop' }, { value: 'growth', label: 'Growth' }]} />
          <span className="kit-toolbar__end"><Button variant="secondary" icon="download">Export</Button></span>
        </div>
        <DataTable chevron onRowClick={() => {}} rows={rows}
          columns={[
            { key: 'date', label: 'Date', width: 140 },
            { key: 'event', label: 'Event', render: (v) => <span style={{ whiteSpace: 'normal' }}>{v}</span> },
            { key: 'section', label: 'Section' },
            { key: 'impact', label: 'Impact', width: 90, render: (v) => <Badge tone={v < 0 ? 'danger' : v > 0 ? 'info' : 'neutral'} size="md">{v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0'}</Badge> }
          ]} />
        {rows.length === 0 ? <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>No events match this filter.</div> : null}
      </Panel>
    </div>
  );
}
window.AnalyticsScreen = AnalyticsScreen;
})();
