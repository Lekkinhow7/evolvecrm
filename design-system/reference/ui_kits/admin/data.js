// Sample content transcribed from the reference screens (Klaris case study).
window.ATData = {
  roles: {
    admin: {
      user: { initials: 'IV', name: 'I. Vorontsov', role: 'System administrator' },
      quick: [
        { id: 'analytics', label: 'Analytics', icon: 'activity' },
        { id: 'tasks', label: 'Tasks', icon: 'square-check' },
        { id: 'micro', label: 'Microbiology', icon: 'atom' },
        { id: 'env', label: 'Environmental monitoring', icon: 'shield-check' }
      ],
      groups: [
        { label: 'Analytics', items: [{ id: 'contractor', label: 'Contractor access', icon: 'log-in' }, { id: 'zones', label: 'Zone classification', icon: 'scan' }] },
        { label: 'Production and control', items: [{ id: 'batch', label: 'Batch movement', icon: 'layout-grid' }, { id: 'validation', label: 'Validation cycles', icon: 'refresh-cw' }, { id: 'pest', label: 'Pest control', icon: 'radio' }, { id: 'waste', label: 'Production waste', icon: 'trash-2' }] },
        { label: 'Equipment', defaultOpen: false, items: [{ id: 'assets', label: 'Assets & PPE', icon: 'shirt' }, { id: 'filters', label: 'HEPA filters', icon: 'gauge' }] },
        { label: 'Documents and access', defaultOpen: false, items: [{ id: 'records', label: 'Records & files', icon: 'file-text' }, { id: 'permissions', label: 'Permissions', icon: 'key-round' }] },
        { label: 'Administration', defaultOpen: false, items: [{ id: 'audit', label: 'Audit log', icon: 'history' }, { id: 'settings', label: 'Settings', icon: 'settings' }] }
      ]
    },
    employee: {
      user: { initials: 'EP', name: 'E. Panova', role: 'Employee' },
      quick: [
        { id: 'tasks', label: 'Tasks', icon: 'square-check' },
        { id: 'training', label: 'Training', icon: 'graduation-cap' },
        { id: 'pass', label: 'My pass', icon: 'id-card' },
        { id: 'shifts', label: 'Shift schedule', icon: 'calendar-days' }
      ],
      groups: [
        { label: 'Zone work', items: [{ id: 'sop', label: 'Instructions & SOP', icon: 'file-text' }, { id: 'ppe', label: 'Workwear & PPE', icon: 'shirt' }, { id: 'deviation', label: 'Report a deviation', icon: 'triangle-alert' }] }
      ]
    }
  },
  crumbs: {
    analytics: ['Analytics', 'Analytics'], tasks: ['Production and control', 'Tasks'], batch: ['Production and control', 'Batch movement'],
    shifts: ['My day', 'Shift schedule'], pass: ['My day', 'My pass']
  },
  events: [
    { date: '02.09.2026', event: 'Pressure differential in airlock P-2 below limit for 6 hours', section: 'Environmental monitoring', impact: -4, kind: 'drop' },
    { date: '01.09.2026', event: 'Validation cycle no. 4412 closed', section: 'Validation cycles', impact: 6, kind: 'growth' },
    { date: '31.08.2026', event: 'Medical check expired: A. Sokolov', section: 'Users', impact: -3, kind: 'drop' },
    { date: '29.08.2026', event: 'Pest control points inspected on time', section: 'Pest control', impact: 2, kind: 'growth' },
    { date: '28.08.2026', event: 'External visit: HVAC service engineer', section: 'Contractor access', impact: 0, kind: 'neutral' }
  ],
  batches: [
    { date: '02.09.2026', op: 'Batch start', type: 'start', area: 'R-205', qty: '318 000', doc: 'BATCH-4412-09', status: 'Recorded' },
    { date: '02.09.2026', op: 'Transfer to packaging', type: 'start', area: 'R-207', qty: '120 400', doc: 'BATCH-4409-03', status: 'Recorded' },
    { date: '01.09.2026', op: 'Batch release', type: 'release', area: 'R-101', qty: '96 000', doc: 'BATCH-4398-11', status: 'Review' },
    { date: '31.08.2026', op: 'Batch release', type: 'release', area: 'R-205', qty: '210 500', doc: 'BATCH-4391-02', status: 'Recorded' }
  ],
  risks: [
    { tone: 'danger', title: 'Swabs R-207', unit: 'Laboratory', meta: 'Was due 03.09.2026', badge: 'Overdue' },
    { tone: 'warning', icon: 'refresh-cw', title: 'Pressure P-2', unit: 'Quality unit', meta: 'Due 05.09.2026', badge: 'Due soon' },
    { tone: 'danger', title: 'Sokolov clearance', unit: 'Personnel', meta: '9 days overdue', badge: 'Overdue' },
    { tone: 'warning', icon: 'refresh-cw', title: 'Particle counter', unit: 'Quality unit', meta: 'Due 12.09.2026', badge: 'Due soon' },
    { tone: 'info', icon: 'gauge', title: 'HEPA filter', unit: 'Production', meta: 'Next check 20.09.2026', badge: 'Monitored' }
  ],
  flow: [
    { unit: 'Laboratory', icon: 'atom', cells: [{ title: 'Swabs R-207', sub: 'Surface monitoring', tone: 'info' }, null, null, null] },
    { unit: 'Quality unit', icon: 'shield-check', cells: [null, { title: 'Pressure P-2', sub: 'Parameter check', tone: 'info' }, null, null] },
    { unit: 'Production', icon: 'package', cells: [null, null, { title: 'Waste report', sub: 'Approval', tone: 'warning' }, null] },
    { unit: 'Personnel', icon: 'users', cells: [{ title: 'Renew the medical check', sub: '9 days overdue', tone: 'danger' }, null, null, { title: 'CAPA-026', sub: 'Actions in progress', tone: 'success' }] }
  ],
  day: [
    { time: '09:00', title: 'Take swabs, R-207', sub: 'Microbiological control', tone: 'success', badge: 'Due today', badgeTone: 'info' },
    { time: '11:30', title: 'Check pressure, P-2', sub: 'Utility systems', tone: 'info', badge: 'In progress', badgeTone: 'active' },
    { time: '14:00', title: 'Renew the medical check', sub: 'Personnel', tone: 'danger', badge: 'Overdue', badgeTone: 'danger' },
    { time: '16:30', title: 'Waste disposal report', sub: 'Production waste', tone: 'warning', badge: 'Review', badgeTone: 'warning' }
  ]
};
