(() => {
const { PageHeader, Button, Panel, StatCard, BarChart, DonutChart, Legend, Badge, TaskCard, RiskItem, Icon, ChartTooltip } = window.AliceTeixeiraDesignSystem_69f9f3;

function TasksScreen({ onOpenDay }) {
  const D = window.ATData;
  const days = [
    { label: 'Mon', total: 2.9 },
    { label: 'Tue', total: 5, tooltip: { title: 'Tuesday, 08.09', value: '5', unit: 'tasks closed', chip: '+1.7 vs average' } },
    { label: 'Wed', total: 2 },
    { label: 'Thu', total: 3.8 },
    { label: 'Fri', total: 5.8 },
    { label: 'Sat', total: 1, highlight: true },
    { label: 'Sun', value: 1.9, tone: 'lime' }
  ];
  const cols = ['Planned', 'In progress', 'Review', 'Closed'];
  return (
    <div className="kit-page">
      <PageHeader title="Tasks" subtitle="Site tasks by unit: workload, flow and risks." actions={<><Button variant="secondary">Export</Button><Button onClick={onOpenDay}>Create task</Button></>} />
      <div className="kit-kpis">
        <StatCard variant="ink" label="Overdue" value="1" unit="needs action" />
        <StatCard label="Due today" value="3" />
        <StatCard label="In progress" value="7" />
        <StatCard variant="lime" label="Closed this week" value="14" />
      </div>
      <div className="kit-row">
        <Panel title="Tasks closed per day" meta={<Badge tone="neutral" size="md">7 days</Badge>}>
          <BarChart max={6} height={330} yTicks={['6', '4', '2', '0']} activeIndex={1} data={days} barWidth={66} />
        </Panel>
        <Panel title="Tasks by status" meta={<Badge tone="neutral" size="md">now</Badge>}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <DonutChart size={236} thickness={38} value="25" label="total tasks" segments={[{ value: 14, color: 'var(--viz-2)' }, { value: 7, color: 'var(--cyan-500)' }, { value: 3, color: 'var(--lime-500)' }, { value: 1, color: 'var(--red-500)' }]} />
          </div>
          <Legend style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px', fontSize: 15, color: 'var(--text-primary)' }} items={[
            { label: 'In progress', color: 'var(--cyan-500)', shape: 'dot', value: 7 }, { label: 'Due today', color: 'var(--lime-500)', shape: 'dot', value: 3 },
            { label: 'Overdue', color: 'var(--red-500)', shape: 'dot', value: 1 }, { label: 'Closed this week', color: 'var(--viz-2)', shape: 'dot', value: 14 }]} />
        </Panel>
      </div>
      <div className="kit-row kit-row--wide">
        <Panel title="Task flow" meta={<Badge tone="neutral" size="md">by unit</Badge>}>
          <div className="kit-flow">
            <div className="kit-flow__grid">
              <span />
              {cols.map((c) => <div className="kit-flow__col" key={c}>{c.toUpperCase()}</div>)}
              {D.flow.map((r) => (
                <React.Fragment key={r.unit}>
                  <div className="kit-flow__unit"><Icon name={r.icon} size={16} />{r.unit}</div>
                  {r.cells.map((c, i) => <div className="kit-flow__cell" key={i}>{c ? <TaskCard title={c.title} subtitle={c.sub} tone={c.tone} onClick={onOpenDay} /> : null}</div>)}
                </React.Fragment>
              ))}
            </div>
          </div>
        </Panel>
        <Panel title="Risks" meta={<Badge tone="neutral" size="md">{D.risks.length}</Badge>} style={{ gap: 4 }}>
          <div>{D.risks.map((r) => <RiskItem key={r.title} {...r} />)}</div>
        </Panel>
      </div>
    </div>
  );
}
window.TasksScreen = TasksScreen;
})();
