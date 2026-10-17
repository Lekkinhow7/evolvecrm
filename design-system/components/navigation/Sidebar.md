Primary navigation — one per app, inside AppShell. Quick-access tiles are the role's 4 most used sections; everything else lives in groups.

```jsx
<Sidebar active="tasks" onNavigate={go} notifications
  quick={[{id:'analytics',label:'Analytics',icon:'activity'},{id:'tasks',label:'Tasks',icon:'square-check'}]}
  groups={[{label:'Production and control',items:[{id:'batch',label:'Batch movement',icon:'layout-grid'}]}]}
  user={{initials:'IV',name:'I. Vorontsov',role:'System administrator'}} />
```

- Group labels are UPPERCASE (CSS), written sentence case in data.
- On < 1024px AppShell turns it into a slide-in drawer.
