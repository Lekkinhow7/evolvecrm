(() => {
const { PageHeader, Button, Panel, StatCard, AreaChart, ChartTooltip, TickGauge, KeyValueList, DataTable, Badge, SearchInput, ChipGroup } = window.AliceTeixeiraDesignSystem_69f9f3;

function BatchScreen() {
  const D = window.ATData;
  const [q, setQ] = React.useState('');
  const [f, setF] = React.useState('all');
  const rows = D.batches.filter((b) => (f === 'all' || b.type === f) && (!q || (b.op + b.doc + b.area).toLowerCase().includes(q.toLowerCase())));
  const out = [17720, 17980, 18160, 18040, 17860, 17930, 18250, 18470, 18380];
  const labels = ['Mon', '', 'Tue', 'Wed', 'Thu', '', 'Fri', 'Sat', 'Sun'];
  const dates = ['Mon, 28 Aug', '', 'Tue, 29 Aug', 'Wed, 30 Aug', 'Thu, 31 Aug', '', 'Fri, 1 Sep', 'Sat, 2 Sep', 'Sun, 3 Sep'];
  return (
    <div className="kit-page">
      <PageHeader title="Batch movement" subtitle="Start, transfer and release of production batches across areas." actions={<Button variant="secondary">Export</Button>} />
      <div className="kit-kpis">
        <StatCard variant="cyan" label="Started this week" value="+12" unit="batches" />
        <StatCard label="Released" value="9" unit="batches" />
        <StatCard label="Rejects" value="0,18" unit="% · limit 0.4%" />
        <StatCard variant="ink" label="In progress" value="12" unit="batches" />
      </div>
      <div className="kit-row">
        <Panel title="Product output" meta={<Badge tone="neutral" size="md">7 days</Badge>}>
          <AreaChart data={out} labels={labels} min={17600} max={18600} yTicks={6} height={300} activeIndex={3}
            renderTooltip={(v, i) => <ChartTooltip variant="line" title={dates[i] || 'Week 35'} label="Output" value={v.toLocaleString('ru-RU')} unit="units" />} />
        </Panel>
        <Panel title="Area workload">
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '6px 0 4px' }}>
            <TickGauge value={84} size={150} />
            <div><div style={{ fontSize: 34, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>21 of 25</div><div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>shifts loaded</div></div>
          </div>
          <KeyValueList ruled items={[{ label: 'Free', value: '4 shifts' }, { label: 'Validation · R-207', value: '1 shift' }, { label: 'Stopped · R-101', value: '0' }]} />
        </Panel>
      </div>
      <Panel>
        <div className="kit-toolbar">
          <SearchInput placeholder="Search the table" value={q} onChange={setQ} />
          <ChipGroup value={f} onChange={setF} options={[{ value: 'all', label: 'All operations' }, { value: 'start', label: 'Starts' }, { value: 'release', label: 'Release' }]} />
        </div>
        <DataTable rows={rows} onRowClick={() => {}} columns={[
          { key: 'date', label: 'Date' }, { key: 'op', label: 'Operation' }, { key: 'area', label: 'Area' },
          { key: 'qty', label: 'Quantity', numeric: true }, { key: 'doc', label: 'Document' },
          { key: 'status', label: 'Status', render: (v) => <Badge tone={v === 'Review' ? 'warning' : 'info'}>{v}</Badge> }
        ]} />
      </Panel>
    </div>
  );
}
window.BatchScreen = BatchScreen;
})();
