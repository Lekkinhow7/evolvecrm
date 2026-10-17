(() => {
const NS = window.AliceTeixeiraDesignSystem_69f9f3;
const { AppShell, Sidebar, Topbar, Modal, ModalSection, InfoTile, TextField, FileDrop, FileItem, Button, ScheduleItem, Panel, Icon3D } = NS;

const SCREENS = { analytics: 'AnalyticsScreen', tasks: 'TasksScreen', batch: 'BatchScreen', shifts: 'ShiftsScreen', pass: 'PassScreen' };
const ROLE_OF = { analytics: 'admin', batch: 'admin', shifts: 'employee', pass: 'employee' };
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function readHash() { const h = (location.hash || '').replace('#', ''); return h || 'tasks'; }

function RecordModal({ onClose }) {
  return (
    <Modal title="Medical record book" subtitle="Medical section" art="../../../assets/icons-3d/records-files.png" onClose={onClose} width={640}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={onClose}>Save</Button></>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
        <InfoTile label="Status" value="Valid" /><InfoTile label="Remaining" value="5 months" /><InfoTile label="Access" value="Zones A/B, C, D" />
      </div>
      <ModalSection title="Document">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          <TextField label="Number" defaultValue="Medical Book No. 77-0421" />
          <TextField label="Issued" defaultValue="14.02.2026" />
          <TextField label="Valid through" defaultValue="14.02.2027" />
          <TextField label="Medical centre" defaultValue="Profmed Medical Center, Dubna" />
        </div>
      </ModalSection>
      <ModalSection title="Attachments">
        <FileDrop />
        <FileItem name="Medical book, spreads" meta="2.4 MB · 14.02.2026" />
      </ModalSection>
    </Modal>
  );
}

function DayModal({ day, onClose }) {
  const d = new Date(2026, 8, day);
  const items = window.ATData.day;
  return (
    <Modal plain title={WD[d.getDay()] + ', ' + MONTH[8] + ' ' + day} subtitle={items.length + ' tasks · ' + (day === 9 ? 'today' : 'planned')} lead={<div className="at-modal__date">{day}</div>} onClose={onClose} width={560}
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button icon="plus">Add task</Button></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((t) => <ScheduleItem key={t.time} time={t.time} title={t.title} subtitle={t.sub} tone={t.tone} badge={t.badge} badgeTone={t.badgeTone} />)}
      </div>
    </Modal>
  );
}

function QRModal({ onClose }) {
  return (
    <Modal plain title="Pass № 0421-7714" subtitle="Present the QR code at the relevant access point." onClose={onClose} width={440} footer={<Button onClick={onClose}>Close</Button>}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
        <img src="../../../assets/imagery/qr-sample.png" alt="Pass QR code" style={{ width: 240, height: 240, borderRadius: 24, boxShadow: 'var(--shadow-md)' }} />
      </div>
    </Modal>
  );
}

function NotInKit({ label }) {
  return (
    <Panel variant="tint" style={{ alignItems: 'center', textAlign: 'center', padding: '56px 24px' }}>
      <Icon3D name="library" size={112} base="../../../assets/icons-3d/" />
      <div style={{ fontSize: 20, fontWeight: 500 }}>{label}</div>
      <div style={{ color: 'var(--text-secondary)', maxWidth: 420 }}>This section was not part of the reference screens, so it is intentionally left blank in the UI kit.</div>
    </Panel>
  );
}

function App() {
  const D = window.ATData;
  const [page, setPage] = React.useState(readHash());
  const [role, setRole] = React.useState(ROLE_OF[readHash()] || 'admin');
  const [theme, setTheme] = React.useState(localStorage.getItem('at-kit-theme') || 'light');
  const [lang, setLang] = React.useState('EN');
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawer, setDrawer] = React.useState(false);
  const [modal, setModal] = React.useState(null);
  const mq = React.useMemo(() => window.matchMedia('(max-width: 1023px)'), []);

  React.useEffect(() => { document.documentElement.setAttribute('data-theme', theme); localStorage.setItem('at-kit-theme', theme); }, [theme]);
  React.useEffect(() => {
    const on = () => { const h = readHash(); setPage(h); if (ROLE_OF[h]) setRole(ROLE_OF[h]); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const go = (id) => { location.hash = id; setPage(id); setDrawer(false); window.scrollTo(0, 0); };
  const r = D.roles[role];
  const allItems = r.quick.concat(...r.groups.map((g) => g.items));
  const cur = allItems.find((i) => i.id === page);
  const crumbs = (D.crumbs[page] || [role === 'admin' ? 'Workspace' : 'My day', cur ? cur.label : 'Overview']).map((label) => ({ label }));
  const Screen = SCREENS[page] ? window[SCREENS[page]] : null;
  const openDay = (d) => setModal({ type: 'day', day: typeof d === 'number' ? d : 9 });

  return (
    <>
      <AppShell drawerOpen={drawer} onDrawerClose={() => setDrawer(false)}
        sidebar={<Sidebar collapsed={collapsed && !mq.matches} active={page} onNavigate={go} notifications quick={r.quick} groups={r.groups}
          user={Object.assign({}, r.user, { onClick: () => { const nr = role === 'admin' ? 'employee' : 'admin'; setRole(nr); go(nr === 'admin' ? 'tasks' : 'shifts'); } })} />}>
        <Topbar crumbs={crumbs} sidebarCollapsed={mq.matches ? !drawer : collapsed}
          onToggleSidebar={() => (mq.matches ? setDrawer(true) : setCollapsed(!collapsed))}
          lang={lang} onLang={setLang} theme={theme} onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          org={role === 'admin' ? 'Farmavex JSC, Dubna plant' : undefined} />
        {Screen ? <Screen onOpenDay={openDay} onOpenRecord={() => setModal({ type: 'record' })} onShowQR={() => setModal({ type: 'qr' })} /> : <NotInKit label={cur ? cur.label : page} />}
      </AppShell>
      {modal && modal.type === 'record' ? <RecordModal onClose={() => setModal(null)} /> : null}
      {modal && modal.type === 'day' ? <DayModal day={modal.day} onClose={() => setModal(null)} /> : null}
      {modal && modal.type === 'qr' ? <QRModal onClose={() => setModal(null)} /> : null}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
