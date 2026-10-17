(() => {
const { PageHeader, Panel, StatCard, ShiftCard, Calendar, Legend, Badge, Button, ListRow } = window.AliceTeixeiraDesignSystem_69f9f3;

function ShiftsScreen({ onOpenDay }) {
  const [sel, setSel] = React.useState(null);
  const M = 'cyan', L = 'lime';
  const cells = { 1: M, 2: L, 3: M, 4: M, 7: M, 8: L, 9: M, 10: M, 11: L, 13: 'ring', 14: L, 15: M, 16: M, 17: L, 18: M, 21: M, 22: M, 23: L, 24: M, 25: M, 28: M, 29: L, 30: M };
  const week = [['Mon', 7, 'cyan', 'Morning', '07:00–15:30', 'Grade A/B · line 2'], ['Tue', 8, 'cyan', 'Morning', '07:00–15:30', 'Grade A/B · line 2'], ['Wed', 9, 'lime', 'Day', '11:00–19:30', 'Grade C · washing'], ['Thu', 10, 'cyan', 'Morning', '07:00–15:30', 'Grade A/B · line 2'], ['Fri', 11, 'lime', 'Day', '11:00–19:30', 'Grade C · washing'], ['Sat', 12, 'off', 'Day off'], ['Sun', 13, 'off', 'Day off']];
  return (
    <div className="kit-page">
      <PageHeader title="Shift schedule" subtitle="Shifts, work zones and shift swaps" />
      <div className="kit-kpis kit-kpis--3">
        <StatCard label="Shifts in September" value="18" />
        <StatCard label="Scheduled hours" value="153" unit="h" />
        <StatCard variant="ink" label="Next shift" value="Mon, 07:00" />
      </div>
      <Panel title="This week">
        <div className="kit-week">{week.map((w) => <ShiftCard key={w[1]} dayLabel={w[0]} dayNumber={w[1]} tone={w[2]} name={w[3]} time={w[4]} zone={w[5]} />)}</div>
        <Legend items={[{ label: 'Morning · 07:00–15:30', color: 'var(--cyan-400)' }, { label: 'Day · 11:00–19:30', color: 'var(--lime-400)' }, { label: 'Day off', color: 'transparent' }]} />
      </Panel>
      <div className="kit-row">
        <Panel title="September 2026" meta={<Badge tone="neutral" size="md">18 shifts · 153 h</Badge>}>
          <Calendar year={2026} month={8} outside={false} cells={cells} selected={sel} onSelect={(d) => { setSel(d); onOpenDay(d); }} cellHeight={44} gap={8} />
        </Panel>
        <Panel title="Shift swap" style={{ gap: 8 }}>
          <div>
            <ListRow title="Thu, 17.09 · Morning → Day" subtitle="Swap with A. Sokolova" trailing={<Badge tone="warning">Review</Badge>} />
            <ListRow title="Mon, 31.08 · Day → Morning" subtitle="Swap with D. Morozov" trailing={<Badge tone="success">Approved</Badge>} />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 12 }}><Button variant="accent-outline" icon="plus">New request</Button></div>
        </Panel>
      </div>
    </div>
  );
}
window.ShiftsScreen = ShiftsScreen;
})();
