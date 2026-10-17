(() => {
const { PageHeader, Panel, Button, Badge, Tag, Avatar, ListRow, BrandMark, Icon } = window.AliceTeixeiraDesignSystem_69f9f3;

function PassScreen({ onOpenRecord, onShowQR }) {
  return (
    <div className="kit-page">
      <PageHeader title="My pass" subtitle="Digital cleanroom pass and pass history" actions={<><Button variant="secondary">Report loss</Button><Button icon="qr-code" onClick={onShowQR}>Show QR</Button></>} />
      <div className="kit-row kit-row--even">
        <div className="kit-pass">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 17, fontWeight: 500 }}><BrandMark height={22} color="#fff" />Alice Teixeira</span>
            <Badge tone="onDark" size="md" dot>Enabled</Badge>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Avatar initials="EP" size={72} radius={20} />
            <div><div style={{ fontSize: 22, fontWeight: 500 }}>Elena Panova</div><div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Sterile filling line operator</div></div>
          </div>
          <button type="button" className="kit-pass__qr" onClick={onShowQR} aria-label="Show QR" style={{ border: 0, cursor: 'pointer' }} />
          <dl>
            <dt>Pass</dt><dt>Valid until</dt><dt>Production</dt>
            <dd>№ 0421-7714</dd><dd>22.03.2027</dd><dd>Filling area</dd>
          </dl>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Tag round style={{ width: 'auto', padding: '0 14px' }}>A/B</Tag><Tag round>C</Tag><Tag round>D</Tag>
            <Tag variant="ghostDark">Animal facility</Tag>
          </div>
        </div>
        <div className="kit-page">
          <Panel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="kit-datepill">February 14 <b>2027</b></span>
            </div>
            <div><div style={{ fontSize: 17, fontWeight: 500 }}>Periodic medical check</div><div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Valid until 14.02.2027</div></div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Badge tone="info" size="md">Valid</Badge><Button variant="accent-outline" size="sm" onClick={onOpenRecord}>Learn more</Button></div>
          </Panel>
          <Panel padding="sm" style={{ gap: 0 }}>
            <ListRow icon="graduation-cap" title="Qualification" subtitle="Zone B entry confirmed" onClick={onOpenRecord} />
            <ListRow icon="file-text" title="Biosafety briefing" subtitle="Completed 18.08.2026" onClick={onOpenRecord} />
          </Panel>
          <Panel title="Last pass" meta={<a href="#pass" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>All entries <Icon name="arrow-right" size={14} /></a>}>
            <div className="kit-entries">
              <span>02.09.2026</span><span>13:02</span><span>Exit</span><span>Airlock P-1</span>
              <span className="m" style={{ marginTop: 10 }}>02.09.2026</span><span className="m" style={{ marginTop: 10 }}>09:14</span><span className="m">Entry</span><span className="m">Airlock P-1</span>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
window.PassScreen = PassScreen;
})();
